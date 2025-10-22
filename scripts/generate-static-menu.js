#!/usr/bin/env node

/*
 * Generate static menu JSON files from `final_menu.json`.
 *
 * Outputs (under `public/static/`):
 *   - menu.json
 *   - menu.json.gz
 *   - menu.hash
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

const ROOT_DIR = path.resolve(__dirname, '..');
const INPUT_PATH = path.join(ROOT_DIR, 'final_menu.json');
const OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'static');
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'menu.json');
const OUTPUT_GZIP = path.join(OUTPUT_DIR, 'menu.json.gz');
const OUTPUT_HASH = path.join(OUTPUT_DIR, 'menu.hash');

function exitWithError(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function slugify(value, fallback = 'item') {
  const base = (value || '')
    .toString()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  if (!base) {
    return fallback;
  }
  return base;
}

function ensureUniqueId(base, used, suffixStart = 1) {
  let candidate = base;
  let counter = suffixStart;
  while (used.has(candidate)) {
    candidate = `${base}-${counter++}`;
  }
  used.add(candidate);
  return candidate;
}

if (!fs.existsSync(INPUT_PATH)) {
  exitWithError(`Input file not found at ${INPUT_PATH}`);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

let rawContent = fs.readFileSync(INPUT_PATH, 'utf8');

// Replace bare NaN tokens with null to avoid JSON parse errors.
rawContent = rawContent.replace(/\bNaN\b/g, 'null');

let sourceRecords;
try {
  sourceRecords = JSON.parse(rawContent);
} catch (error) {
  exitWithError(`Failed to parse JSON: ${error.message}`);
}

if (!Array.isArray(sourceRecords)) {
  exitWithError('Expected the input JSON to contain an array of items.');
}

console.log(`📥 Loaded ${sourceRecords.length} raw records.`);

const generatedAt = new Date().toISOString();
const categoriesMap = new Map();
const categoryOrders = new Map();
const categoryIdSet = new Set();
const itemIdSet = new Set();
const items = [];

function normalizeName(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function getCategory(record) {
  const categoryEn = normalizeName(record['Category Name']) || 'General';
  if (!categoriesMap.has(categoryEn)) {
    const categoryIdBase = slugify(categoryEn, 'category');
    const categoryId = ensureUniqueId(categoryIdBase, categoryIdSet);
    categoriesMap.set(categoryEn, {
      id: categoryId,
      names: {
        en: categoryEn,
        tr: categoryEn,
        ar: categoryEn,
      },
      icon: '🍽️',
      color: '#0C6071',
      image: null,
      order: categoriesMap.size,
      created_at: generatedAt,
    });
    categoryOrders.set(categoryId, 0);
  }
  return categoriesMap.get(categoryEn);
}

for (const record of sourceRecords) {
  const category = getCategory(record);
  const order = categoryOrders.get(category.id) || 0;

  const nameEn = normalizeName(record['Name_En']);
  const itemIdBase = slugify(nameEn || `${category.id}-item`, 'item');
  const itemId = ensureUniqueId(itemIdBase, itemIdSet);

  const priceValue = Number(record['Price']);
  const price = Number.isFinite(priceValue) ? priceValue : 0;

  items.push({
    id: itemId,
    names: {
      en: nameEn,
      tr: normalizeName(record['Name_tr']) || nameEn,
      ar: normalizeName(record['Name_Ar']) || nameEn,
    },
    descriptions: undefined,
    category_id: category.id,
    price,
    image: null,
    tags: ['menu-item'],
    variants: undefined,
    is_available: true,
    order,
    created_at: generatedAt,
  });

  categoryOrders.set(category.id, order + 1);
}

const categories = Array.from(categoriesMap.values()).sort(
  (a, b) => a.order - b.order,
);

const payload = {
  categories,
  items,
  generatedAt,
  version: '1.0.0',
  metadata: {
    totalCategories: categories.length,
    totalItems: items.length,
    lastUpdated: generatedAt,
    cacheExpiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  },
};

const jsonString = JSON.stringify(payload, null, 2);
fs.writeFileSync(OUTPUT_JSON, jsonString, 'utf8');
console.log(`✅ Wrote ${OUTPUT_JSON}`);

const gzBuffer = zlib.gzipSync(jsonString, { level: 9 });
fs.writeFileSync(OUTPUT_GZIP, gzBuffer);
console.log(`✅ Wrote ${OUTPUT_GZIP}`);

const hash = crypto.createHash('sha256').update(jsonString).digest('hex');
fs.writeFileSync(OUTPUT_HASH, hash, 'utf8');
console.log(`✅ Wrote ${OUTPUT_HASH}`);

console.log('🎉 Static menu generation complete!');

