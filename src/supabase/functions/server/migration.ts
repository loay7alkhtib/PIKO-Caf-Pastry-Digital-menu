import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

// Deno environment types
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Supabase admin client for migration
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Helper function to generate UUID
function generateId() {
  return crypto.randomUUID();
}

// Helper function to create slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

interface KVCategory {
  id: string;
  names: { en: string; tr: string; ar: string };
  icon: string;
  image?: string;
  order: number;
  created_at: string;
}

interface KVItem {
  id: string;
  names: { en: string; tr: string; ar: string };
  descriptions?: { en?: string; tr?: string; ar?: string };
  category_id: string;
  price: number;
  image?: string;
  tags: string[];
  variants?: { size: string; price: number }[];
  is_available?: boolean;
  created_at: string;
}

export async function migrateToRelationalDB() {
  console.log('🚀 Starting migration from KV store to relational database...');

  try {
    // Step 1: Read all categories from KV store
    console.log('📖 Reading categories from KV store...');
    const categoryIds = (await kv.get('piko:category-ids')) || [];
    const categories: KVCategory[] = [];

    for (const id of categoryIds) {
      const category = await kv.get(`piko:category:${id}`);
      if (category) {
        categories.push(category);
      }
    }

    console.log(`✅ Found ${categories.length} categories`);

    // Step 2: Read all items from KV store
    console.log('📖 Reading items from KV store...');
    const itemIds = (await kv.get('piko:item-ids')) || [];
    const items: KVItem[] = [];

    for (const id of itemIds) {
      const item = await kv.get(`piko:item:${id}`);
      if (item) {
        items.push(item);
      }
    }

    console.log(`✅ Found ${items.length} items`);

    // Step 3: Create ID mapping for categories
    const categoryIdMap = new Map<string, string>();

    // Step 4: Migrate categories
    console.log('🔄 Migrating categories...');
    for (const kvCategory of categories) {
      const newCategoryId = generateId();
      categoryIdMap.set(kvCategory.id, newCategoryId);

      // Insert into categories table
      const { error: categoryError } = await supabase
        .from('categories')
        .insert({
          id: newCategoryId,
          slug: createSlug(kvCategory.names.en),
          sort_order: kvCategory.order,
          is_active: true,
          image_url: kvCategory.image || null,
          created_at: kvCategory.created_at,
          updated_at: new Date().toISOString(),
        });

      if (categoryError) {
        console.error(
          `❌ Error inserting category ${kvCategory.names.en}:`,
          categoryError,
        );
        throw categoryError;
      }

      // Insert translations into category_i18n table
      const translations = [
        { locale: 'en', name: kvCategory.names.en },
        { locale: 'tr', name: kvCategory.names.tr },
        { locale: 'ar', name: kvCategory.names.ar },
      ];

      for (const translation of translations) {
        const { error: translationError } = await supabase
          .from('category_i18n')
          .insert({
            id: generateId(),
            category_id: newCategoryId,
            locale: translation.locale,
            name: translation.name,
            created_at: new Date().toISOString(),
          });

        if (translationError) {
          console.error(
            `❌ Error inserting category translation ${translation.locale}:`,
            translationError,
          );
          throw translationError;
        }
      }

      console.log(`✅ Migrated category: ${kvCategory.names.en}`);
    }

    // Step 5: Create ID mapping for items
    const itemIdMap = new Map<string, string>();

    // Step 6: Migrate items
    console.log('🔄 Migrating items...');
    for (const kvItem of items) {
      const newItemId = generateId();
      itemIdMap.set(kvItem.id, newItemId);

      // Get the new category ID
      const newCategoryId = categoryIdMap.get(kvItem.category_id);
      if (!newCategoryId) {
        console.error(
          `❌ Category not found for item ${kvItem.names.en}: ${kvItem.category_id}`,
        );
        continue;
      }

      // Insert into items table
      const { error: itemError } = await supabase.from('items').insert({
        id: newItemId,
        category_id: newCategoryId,
        image_url: kvItem.image || null,
        is_active: kvItem.is_available !== false,
        sort_order: 0, // Will be updated later if needed
        created_at: kvItem.created_at,
        updated_at: new Date().toISOString(),
      });

      if (itemError) {
        console.error(`❌ Error inserting item ${kvItem.names.en}:`, itemError);
        throw itemError;
      }

      // Insert translations into item_i18n table
      const translations = [
        {
          locale: 'en',
          name: kvItem.names.en,
          description: kvItem.descriptions?.en,
        },
        {
          locale: 'tr',
          name: kvItem.names.tr,
          description: kvItem.descriptions?.tr,
        },
        {
          locale: 'ar',
          name: kvItem.names.ar,
          description: kvItem.descriptions?.ar,
        },
      ];

      for (const translation of translations) {
        const { error: translationError } = await supabase
          .from('item_i18n')
          .insert({
            id: generateId(),
            item_id: newItemId,
            locale: translation.locale,
            name: translation.name,
            description: translation.description || null,
            created_at: new Date().toISOString(),
          });

        if (translationError) {
          console.error(
            `❌ Error inserting item translation ${translation.locale}:`,
            translationError,
          );
          throw translationError;
        }
      }

      // Insert base price into item_prices table
      const { error: basePriceError } = await supabase
        .from('item_prices')
        .insert({
          id: generateId(),
          item_id: newItemId,
          size_name: 'Regular', // Default size name
          price_cents: Math.round(kvItem.price * 100), // Convert to cents
          is_active: true,
          sort_order: 0,
          created_at: new Date().toISOString(),
        });

      if (basePriceError) {
        console.error(
          `❌ Error inserting base price for item ${kvItem.names.en}:`,
          basePriceError,
        );
        throw basePriceError;
      }

      // Insert variants into item_prices table
      if (kvItem.variants && kvItem.variants.length > 0) {
        for (let i = 0; i < kvItem.variants.length; i++) {
          const variant = kvItem.variants[i];
          const { error: variantError } = await supabase
            .from('item_prices')
            .insert({
              id: generateId(),
              item_id: newItemId,
              size_name: variant.size,
              price_cents: Math.round(variant.price * 100), // Convert to cents
              is_active: true,
              sort_order: i + 1,
              created_at: new Date().toISOString(),
            });

          if (variantError) {
            console.error(
              `❌ Error inserting variant for item ${kvItem.names.en}:`,
              variantError,
            );
            throw variantError;
          }
        }
      }

      console.log(`✅ Migrated item: ${kvItem.names.en}`);
    }

    // Step 7: Store ID mappings for reference
    console.log('💾 Storing ID mappings...');
    await kv.set(
      'migration:category-id-map',
      Object.fromEntries(categoryIdMap),
    );
    await kv.set('migration:item-id-map', Object.fromEntries(itemIdMap));

    // Step 8: Verify migration
    console.log('🔍 Verifying migration...');

    const { count: categoryCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    const { count: itemCount } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true });

    const { count: categoryI18nCount } = await supabase
      .from('category_i18n')
      .select('*', { count: 'exact', head: true });

    const { count: itemI18nCount } = await supabase
      .from('item_i18n')
      .select('*', { count: 'exact', head: true });

    const { count: itemPricesCount } = await supabase
      .from('item_prices')
      .select('*', { count: 'exact', head: true });

    console.log('📊 Migration Results:');
    console.log(`  Categories: ${categoryCount}`);
    console.log(`  Category Translations: ${categoryI18nCount}`);
    console.log(`  Items: ${itemCount}`);
    console.log(`  Item Translations: ${itemI18nCount}`);
    console.log(`  Item Prices: ${itemPricesCount}`);

    console.log('🎉 Migration completed successfully!');

    return {
      success: true,
      categories: categoryCount,
      categoryTranslations: categoryI18nCount,
      items: itemCount,
      itemTranslations: itemI18nCount,
      itemPrices: itemPricesCount,
      categoryIdMap: Object.fromEntries(categoryIdMap),
      itemIdMap: Object.fromEntries(itemIdMap),
    };
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
}

// Export for use in Edge Function
export { generateId, createSlug };
