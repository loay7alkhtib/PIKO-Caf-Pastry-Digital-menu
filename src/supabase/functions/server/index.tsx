import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Supabase admin client for auth
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper function to generate UUID
function generateId() {
  return crypto.randomUUID();
}

// Health check endpoint
app.get("/make-server-4050140e/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Test endpoint for debugging
app.post("/make-server-4050140e/test-signup", async (c) => {
  try {
    const body = await c.req.json();
    console.log("Test signup received:", body);
    return c.json({ 
      success: true, 
      received: body,
      message: "Test endpoint working"
    });
  } catch (error: any) {
    console.error("Test signup error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Ensure admin credentials exist (can be called anytime)
app.post("/make-server-4050140e/ensure-admin", async (c) => {
  try {
    const adminCreds = {
      email: 'admin@piko.com',
      password: 'admin123',
    };
    
    // Always set/update admin credentials
    await kv.set("piko:admin-credentials", adminCreds);
    
    // Verify they were stored
    const stored = await kv.get("piko:admin-credentials");
    console.log("Admin credentials ensured:", stored);
    
    return c.json({ 
      success: true,
      verified: !!stored,
      email: stored?.email
    });
  } catch (error: any) {
    console.error("Error ensuring admin credentials:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Test endpoint
app.get("/make-server-4050140e/test", async (c) => {
  return c.json({ status: "ok", message: "Server is running" });
});

// Debug endpoint to check user
app.get("/make-server-4050140e/debug/user/:email", async (c) => {
  const email = c.req.param('email');
  const user = await kv.get(`piko:user:${email}`);
  return c.json({ exists: !!user, user: user || null });
});

// Debug endpoint to delete user (for testing)
app.delete("/make-server-4050140e/debug/user/:email", async (c) => {
  const email = c.req.param('email');
  await kv.del(`piko:user:${email}`);
  
  // Also remove from email list
  const userEmails = (await kv.get("piko:user-emails")) || [];
  const filtered = userEmails.filter((e: string) => e !== email);
  await kv.set("piko:user-emails", filtered);
  
  return c.json({ deleted: true });
});

// Sign up endpoint
app.post("/make-server-4050140e/auth/signup", async (c) => {
  try {
    console.log("=== SIGNUP ENDPOINT HIT ===");
    const body = await c.req.json();
    console.log("Signup request body:", JSON.stringify(body));
    
    const { email, password, name } = body;
    console.log("Signup attempt for email:", email, "name:", name);
    
    // Validate input
    if (!email || !password || !name) {
      console.log("❌ Missing required fields:", { email: !!email, password: !!password, name: !!name });
      return c.json({ error: "Email, password, and name are required" }, 400);
    }
    
    if (password.length < 6) {
      console.log("❌ Password too short");
      return c.json({ error: "Password must be at least 6 characters" }, 400);
    }
    
    // Check if user already exists
    console.log("🔍 Checking if user exists...");
    const existingUser = await kv.get(`piko:user:${email}`);
    console.log("Existing user check result:", existingUser ? "USER EXISTS" : "NO USER FOUND");
    
    if (existingUser) {
      console.log("❌ User already exists");
      return c.json({ error: "User with this email already exists" }, 409);
    }
    
    // Create user
    console.log("✅ Creating new user...");
    const user = {
      email,
      password, // In production, this should be hashed
      name,
      created_at: new Date().toISOString(),
    };
    
    console.log("💾 Saving user to KV store...");
    await kv.set(`piko:user:${email}`, user);
    console.log("✅ User created in KV store");
    
    // Add to user list
    console.log("📝 Adding to user email list...");
    const userEmails = (await kv.get("piko:user-emails")) || [];
    userEmails.push(email);
    await kv.set("piko:user-emails", userEmails);
    console.log("✅ User added to email list");
    
    // Generate session token
    console.log("🔑 Generating session token...");
    const sessionToken = crypto.randomUUID();
    const session = {
      token: sessionToken,
      email: email,
      name: name,
      createdAt: new Date().toISOString(),
    };
    
    console.log("💾 Saving session to KV store...");
    await kv.set(`piko:session:${sessionToken}`, session);
    console.log("✅ Session created for:", email);
    
    console.log("🎉 Signup complete, returning response...");
    const response = { 
      session: {
        access_token: sessionToken,
        user: { email, name }
      }
    };
    console.log("Response to send:", JSON.stringify(response));
    return c.json(response);
  } catch (error: any) {
    console.error("Signup error details:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Error type:", typeof error);
    return c.json({ 
      error: error.message || "Signup failed",
      details: String(error)
    }, 500);
  }
});

// Get session endpoint
app.get("/make-server-4050140e/auth/session", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ session: null });
    }
    
    const session = await kv.get(`piko:session:${token}`);
    
    if (session) {
      return c.json({ 
        session: {
          access_token: token,
          user: { email: session.email, name: session.name, isAdmin: session.isAdmin }
        }
      });
    }
    
    return c.json({ session: null });
  } catch (error: any) {
    console.error("Session check error:", error);
    return c.json({ session: null });
  }
});

// Logout endpoint
app.post("/make-server-4050140e/auth/logout", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token) {
      await kv.del(`piko:session:${token}`);
      console.log("Session deleted:", token);
    }
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error("Logout error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Simple auth endpoint (demo only - not for production)
app.post("/make-server-4050140e/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    console.log("🔐 Login attempt for:", email);
    
    const credentials = await kv.get("piko:admin-credentials");
    console.log("🔍 Admin credentials:", credentials ? "Found" : "Not found");
    
    if (!credentials) {
      console.error("❌ Admin credentials not configured in KV store");
      return c.json({ error: "Admin not configured. Please refresh the page." }, 401);
    }
    
    // Check admin credentials
    console.log("🔍 Checking admin credentials...");
    if (email === credentials.email && password === credentials.password) {
      // Generate a simple session token (for demo purposes)
      const sessionToken = crypto.randomUUID();
      const session = {
        token: sessionToken,
        email: email,
        isAdmin: true,
        createdAt: new Date().toISOString(),
      };
      
      await kv.set(`piko:session:${sessionToken}`, session);
      console.log("✅ Admin login successful for:", email);
      
      return c.json({ 
        session: {
          access_token: sessionToken,
          user: { email, isAdmin: true }
        }
      });
    }
    
    // Check regular user credentials
    console.log("🔍 Checking regular user credentials...");
    const user = await kv.get(`piko:user:${email}`);
    console.log("🔍 User found:", user ? "Yes" : "No");
    
    if (!user) {
      console.log("❌ User not found for:", email);
      return c.json({ error: "Invalid credentials. Please check your email or sign up." }, 401);
    }
    
    console.log("🔍 Password match:", user.password === password ? "Yes" : "No");
    
    if (user.password === password) {
      // Generate a simple session token
      const sessionToken = crypto.randomUUID();
      const session = {
        token: sessionToken,
        email: email,
        name: user.name,
        isAdmin: false,
        createdAt: new Date().toISOString(),
      };
      
      await kv.set(`piko:session:${sessionToken}`, session);
      console.log("✅ User login successful for:", email);
      
      return c.json({ 
        session: {
          access_token: sessionToken,
          user: { email, name: user.name, isAdmin: false }
        }
      });
    }
    
    console.log("❌ Invalid password for:", email);
    return c.json({ error: "Invalid credentials. Please check your password." }, 401);
  } catch (error: any) {
    console.error("💥 Login error:", error);
    return c.json({ error: error.message || "Login failed" }, 500);
  }
});

app.post("/make-server-4050140e/auth/logout", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      await kv.del(`piko:session:${token}`);
    }
    return c.json({ success: true });
  } catch (error: any) {
    console.error("Logout error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-4050140e/auth/session", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return c.json({ session: null });
    }
    
    const token = authHeader.replace("Bearer ", "");
    const session = await kv.get(`piko:session:${token}`);
    
    if (session) {
      return c.json({ 
        session: {
          access_token: token,
          user: { email: session.email }
        }
      });
    } else {
      return c.json({ session: null });
    }
  } catch (error: any) {
    console.error("Session check error:", error);
    return c.json({ session: null });
  }
});

// Initialize full Piko Patisserie menu
app.post("/make-server-4050140e/init-piko-menu", async (c) => {
  try {
    console.log("🚀 Initializing Piko Patisserie & Café menu...");
    
    // Ensure admin credentials exist
    const existingCreds = await kv.get("piko:admin-credentials");
    if (!existingCreds) {
      const adminCreds = {
        email: 'admin@piko.com',
        password: 'admin123',
      };
      await kv.set("piko:admin-credentials", adminCreds);
      console.log("✅ Admin credentials created");
    }
    
    // Create categories with proper IDs and translations
    const categories = [
      { 
        id: "cat-hot-coffee", 
        names: { en: "Hot Coffee", tr: "Sıcak Kahve", ar: "قهوة ساخنة" }, 
        icon: "☕", 
        order: 0 
      },
      { 
        id: "cat-iced-coffee", 
        names: { en: "Iced Coffee", tr: "Soğuk Kahve", ar: "قهوة مثلجة" }, 
        icon: "🧊", 
        order: 1 
      },
      { 
        id: "cat-tea", 
        names: { en: "Tea", tr: "Çay", ar: "شاي" }, 
        icon: "🍵", 
        order: 2 
      },
      { 
        id: "cat-chocolate-drinks", 
        names: { en: "Chocolate Drinks", tr: "Çikolata İçecekleri", ar: "مشروبات الشوكولاتة" }, 
        icon: "🍫", 
        order: 3 
      },
      { 
        id: "cat-smoothies-and-shakes", 
        names: { en: "Smoothies & Shakes", tr: "Smoothie & Milkshake", ar: "سموذي وميلك شيك" }, 
        icon: "🥤", 
        order: 4 
      },
      { 
        id: "cat-juice-and-lemonade", 
        names: { en: "Juice & Lemonade", tr: "Meyve Suyu & Limonata", ar: "عصائر وليموناضة" }, 
        icon: "🍋", 
        order: 5 
      },
      { 
        id: "cat-desserts-and-pastries", 
        names: { en: "Desserts & Pastries", tr: "Tatlılar & Hamur İşleri", ar: "حلويات ومعجنات" }, 
        icon: "🍰", 
        order: 6 
      },
      { 
        id: "cat-misc", 
        names: { en: "Other Drinks", tr: "Diğer İçecekler", ar: "مشروبات أخرى" }, 
        icon: "🥛", 
        order: 7 
      },
    ];

    // Store categories
    const categoryIds = [];
    for (const category of categories) {
      const cat = {
        ...category,
        created_at: new Date().toISOString(),
      };
      await kv.set(`piko:category:${category.id}`, cat);
      categoryIds.push(category.id);
    }
    await kv.set("piko:category-ids", categoryIds);
    console.log(`✅ Created ${categories.length} categories`);

    // Initialize empty lists
    await kv.set("piko:item-ids", []);
    await kv.set("piko:order-ids", []);
    await kv.set("piko:user-emails", []);
    await kv.set("piko:initialized", true);

    return c.json({ 
      success: true,
      message: "Categories created successfully. Use bulk upload for items.",
      categoriesCount: categories.length
    });
  } catch (error: any) {
    console.error("Menu initialization error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Initialize database on first run (legacy)
app.post("/make-server-4050140e/init-db", async (c) => {
  try {
    // Check if already initialized
    const existing = await kv.get("piko:initialized");
    
    // Always ensure admin credentials exist, even if already initialized
    const existingCreds = await kv.get("piko:admin-credentials");
    if (!existingCreds) {
      console.log("Admin credentials missing, storing them now...");
      const adminCreds = {
        email: 'admin@piko.com',
        password: 'admin123',
      };
      await kv.set("piko:admin-credentials", adminCreds);
      const verified = await kv.get("piko:admin-credentials");
      console.log("Admin credentials stored and verified:", verified);
    }
    
    if (existing) {
      return c.json({ 
        message: "Database already initialized",
        adminCredsExist: !!existingCreds || true
      });
    }

    // Seed categories with images
    const categories = [
      { id: generateId(), names: { en: "Breakfast", tr: "Kahvaltı", ar: "فطور" }, icon: "🥐", image: "https://images.unsplash.com/photo-1618667060775-1fe102237f94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmVha2Zhc3QlMjBwYXN0cnklMjBjcm9pc3NhbnR8ZW58MXx8fHwxNzYwMTc1NTI0fDA&ixlib=rb-4.1.0&q=80&w=400&utm_source=figma&utm_medium=referral", order: 0, created_at: new Date().toISOString() },
      { id: generateId(), names: { en: "Hot Drinks", tr: "Sıcak İçecekler", ar: "مشروبات ساخنة" }, icon: "☕", image: "https://images.unsplash.com/photo-1694251826442-08e115e65d1f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3QlMjBjb2ZmZWUlMjBlc3ByZXNzb3xlbnwxfHx8fDE3NjAxNzU1MjR8MA&ixlib=rb-4.1.0&q=80&w=400&utm_source=figma&utm_medium=referral", order: 1, created_at: new Date().toISOString() },
      { id: generateId(), names: { en: "Cold Drinks", tr: "Soğuk İçecekler", ar: "مشروبات باردة" }, icon: "🧊", image: "https://images.unsplash.com/photo-1624030609819-e2a4b1d5aebf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpY2VkJTIwY29sZCUyMGRyaW5rfGVufDF8fHx8MTc2MDE3NTUyNXww&ixlib=rb-4.1.0&q=80&w=400&utm_source=figma&utm_medium=referral", order: 2, created_at: new Date().toISOString() },
      { id: generateId(), names: { en: "Desserts", tr: "Tatlılar", ar: "حلويات" }, icon: "🍰", image: "https://images.unsplash.com/photo-1757961048258-00c5ece18c15?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWtlJTIwZGVzc2VydCUyMHBhc3RyeXxlbnwxfHx8fDE3NjAwOTIyMzZ8MA&ixlib=rb-4.1.0&q=80&w=400&utm_source=figma&utm_medium=referral", order: 3, created_at: new Date().toISOString() },
      { id: generateId(), names: { en: "Salads", tr: "Salatalar", ar: "سلطات" }, icon: "🥗", image: "https://images.unsplash.com/photo-1620019989479-d52fcedd99fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHNhbGFkJTIwYm93bHxlbnwxfHx8fDE3NjAxNjU5NjV8MA&ixlib=rb-4.1.0&q=80&w=400&utm_source=figma&utm_medium=referral", order: 4, created_at: new Date().toISOString() },
      { id: generateId(), names: { en: "Main Courses", tr: "Ana Yemekler", ar: "أطباق رئيسية" }, icon: "🍝", image: "https://images.unsplash.com/photo-1712746784296-e62c1cc7b1f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXN0YSUyMGRpc2glMjBwbGF0ZXxlbnwxfHx8fDE3NjAxMzYwNzh8MA&ixlib=rb-4.1.0&q=80&w=400&utm_source=figma&utm_medium=referral", order: 5, created_at: new Date().toISOString() },
      { id: generateId(), names: { en: "Pizza & Pasta", tr: "Pizza ve Makarna", ar: "بيتزا ومعكرونة" }, icon: "🍕", image: "https://images.unsplash.com/photo-1727003826885-4512f0a8388a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMHNsaWNlJTIwaXRhbGlhbnxlbnwxfHx8fDE3NjAxNzU1Mjd8MA&ixlib=rb-4.1.0&q=80&w=400&utm_source=figma&utm_medium=referral", order: 6, created_at: new Date().toISOString() },
      { id: generateId(), names: { en: "Sandwiches", tr: "Sandviçler", ar: "ساندويتشات" }, icon: "🥪", image: "https://images.unsplash.com/photo-1563045848-170d3bb67320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW5kd2ljaCUyMGdvdXJtZXQlMjBmb29kfGVufDF8fHx8MTc2MDE3NTUyN3ww&ixlib=rb-4.1.0&q=80&w=400&utm_source=figma&utm_medium=referral", order: 7, created_at: new Date().toISOString() },
      { id: generateId(), names: { en: "Ice Cream", tr: "Dondurma", ar: "آيس كريم" }, icon: "🍨", image: "https://images.unsplash.com/photo-1625234969503-49c7f28bc6ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpY2UlMjBjcmVhbSUyMHNjb29wfGVufDF8fHx8MTc2MDE3NTUyN3ww&ixlib=rb-4.1.0&q=80&w=400&utm_source=figma&utm_medium=referral", order: 8, created_at: new Date().toISOString() },
    ];

    // Store categories
    const categoryIds: string[] = [];
    for (const category of categories) {
      await kv.set(`piko:category:${category.id}`, category);
      categoryIds.push(category.id);
    }
    await kv.set("piko:category-ids", categoryIds);

    // Seed some sample items
    const hotDrinksCategory = categories.find(c => c.icon === "☕");
    const dessertsCategory = categories.find(c => c.icon === "🍰");

    const items = [];
    
    if (hotDrinksCategory) {
      items.push(
        { id: generateId(), names: { en: "Espresso", tr: "Espresso", ar: "إسبريسو" }, category_id: hotDrinksCategory.id, price: 45, tags: ["Premium", "Fresh"], image: null, created_at: new Date().toISOString() },
        { id: generateId(), names: { en: "Cappuccino", tr: "Kapuçino", ar: "كابتشينو" }, category_id: hotDrinksCategory.id, price: 65, tags: ["Artisan"], image: null, created_at: new Date().toISOString() },
        { id: generateId(), names: { en: "Turkish Coffee", tr: "Türk Kahvesi", ar: "قهوة تركية" }, category_id: hotDrinksCategory.id, price: 50, tags: ["Traditional"], image: null, created_at: new Date().toISOString() }
      );
    }

    if (dessertsCategory) {
      items.push(
        { id: generateId(), names: { en: "Tiramisu", tr: "Tiramisu", ar: "تيراميسو" }, category_id: dessertsCategory.id, price: 85, tags: ["Premium", "Italian"], image: null, created_at: new Date().toISOString() },
        { id: generateId(), names: { en: "Cheesecake", tr: "Cheesecake", ar: "تشيز كيك" }, category_id: dessertsCategory.id, price: 75, tags: ["Sweet"], image: null, created_at: new Date().toISOString() }
      );
    }

    // Store items
    const itemIds: string[] = [];
    for (const item of items) {
      await kv.set(`piko:item:${item.id}`, item);
      itemIds.push(item.id);
    }
    await kv.set("piko:item-ids", itemIds);

    // Initialize empty orders list
    await kv.set("piko:order-ids", []);
    
    // Initialize empty users list
    await kv.set("piko:user-emails", []);
    console.log("Initialized empty user list");

    // Store admin credentials in KV (for demo purposes)
    const adminCreds = {
      email: 'admin@piko.com',
      password: 'admin123', // In production, this should be hashed
    };
    await kv.set("piko:admin-credentials", adminCreds);
    console.log("Admin credentials stored:", adminCreds);

    // Verify storage
    const storedCreds = await kv.get("piko:admin-credentials");
    console.log("Verified admin credentials in KV:", storedCreds);

    // Mark as initialized
    await kv.set("piko:initialized", true);

    return c.json({ 
      message: "Database initialized successfully",
      categoriesCount: categories.length,
      itemsCount: items.length,
      admin: {
        email: adminCreds.email,
        stored: !!storedCreds
      }
    });
  } catch (error: any) {
    console.error("Database initialization error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Categories endpoints - OPTIMIZED with parallel fetching
app.get("/make-server-4050140e/categories", async (c) => {
  try {
    const categoryIds = await kv.get("piko:category-ids") || [];
    
    // Fetch all categories in parallel (MUCH FASTER)
    const categoryPromises = categoryIds.map((id: string) => 
      kv.get(`piko:category:${id}`)
    );
    const categoriesData = await Promise.all(categoryPromises);
    
    // Filter out nulls and sort
    const categories = categoriesData
      .filter(cat => cat !== null)
      .sort((a, b) => a.order - b.order);
    
    return c.json(categories);
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-4050140e/categories", async (c) => {
  try {
    const data = await c.req.json();
    const id = generateId();
    const category = {
      id,
      names: data.names,
      icon: data.icon,
      image: data.image || undefined,
      order: data.order,
      created_at: new Date().toISOString(),
    };
    
    await kv.set(`piko:category:${id}`, category);
    
    const categoryIds = await kv.get("piko:category-ids") || [];
    categoryIds.push(id);
    await kv.set("piko:category-ids", categoryIds);
    
    return c.json(category);
  } catch (error: any) {
    console.error("Error creating category:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.put("/make-server-4050140e/categories/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    
    const existing = await kv.get(`piko:category:${id}`);
    if (!existing) {
      return c.json({ error: "Category not found" }, 404);
    }
    
    const category = {
      ...existing,
      names: data.names,
      icon: data.icon,
      image: data.image || undefined,
      order: data.order,
    };
    
    await kv.set(`piko:category:${id}`, category);
    return c.json(category);
  } catch (error: any) {
    console.error("Error updating category:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete("/make-server-4050140e/categories/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    // Get the category before deleting
    const category = await kv.get(`piko:category:${id}`);
    if (!category) {
      return c.json({ error: "Category not found" }, 404);
    }
    
    // Archive the category (soft delete)
    const archivedCategory = {
      ...category,
      deleted_at: new Date().toISOString(),
      deleted_by: "admin",
    };
    
    await kv.set(`piko:archive:category:${id}`, archivedCategory);
    
    // Add to archive index
    const archiveIds = await kv.get("piko:archive-category-ids") || [];
    if (!archiveIds.includes(id)) {
      archiveIds.push(id);
      await kv.set("piko:archive-category-ids", archiveIds);
    }
    
    // Remove from active categories
    await kv.del(`piko:category:${id}`);
    
    const categoryIds = await kv.get("piko:category-ids") || [];
    const updatedIds = categoryIds.filter((cid: string) => cid !== id);
    await kv.set("piko:category-ids", updatedIds);
    
    console.log(`✅ Category archived: ${category.names.en}`);
    return c.json({ success: true, archived: true });
  } catch (error: any) {
    console.error("Error deleting category:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Items endpoints
// IMPORTANT: Bulk routes must come BEFORE parameterized routes

// Bulk delete all items
app.delete("/make-server-4050140e/items/bulk/delete-all", async (c) => {
  try {
    console.log("🗑️ Deleting all items...");
    const itemIds = await kv.get("piko:item-ids") || [];
    
    // Delete all items
    for (const id of itemIds) {
      await kv.del(`piko:item:${id}`);
    }
    
    // Clear the item IDs list
    await kv.set("piko:item-ids", []);
    
    console.log(`✅ Deleted ${itemIds.length} items`);
    return c.json({ success: true, deletedCount: itemIds.length });
  } catch (error: any) {
    console.error("Error bulk deleting items:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Bulk create items
app.post("/make-server-4050140e/items/bulk/create", async (c) => {
  try {
    console.log("📦 Bulk creating items...");
    const { items } = await c.req.json();
    
    if (!Array.isArray(items)) {
      return c.json({ error: "Items must be an array" }, 400);
    }
    
    const itemIds = await kv.get("piko:item-ids") || [];
    const createdItems = [];
    
    for (const itemData of items) {
      const id = generateId();
      const item = {
        id,
        names: itemData.names,
        category_id: itemData.category_id,
        price: itemData.price,
        image: itemData.image || null,
        tags: itemData.tags || [],
        variants: itemData.variants || undefined, // Support variants
        created_at: new Date().toISOString(),
      };
      
      await kv.set(`piko:item:${id}`, item);
      itemIds.push(id);
      createdItems.push(item);
    }
    
    await kv.set("piko:item-ids", itemIds);
    
    console.log(`✅ Created ${createdItems.length} items`);
    return c.json({ 
      success: true, 
      createdCount: createdItems.length,
      items: createdItems 
    });
  } catch (error: any) {
    console.error("Error bulk creating items:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-4050140e/items", async (c) => {
  try {
    const categoryId = c.req.query("category_id");
    const itemIds = await kv.get("piko:item-ids") || [];
    
    // Fetch all items in parallel (MUCH FASTER)
    const itemPromises = itemIds.map((id: string) => kv.get(`piko:item:${id}`));
    const itemsData = await Promise.all(itemPromises);
    
    // Filter out nulls, undefined, and invalid items, then filter by category if specified
    const items = itemsData
      .filter(item => item !== null && item !== undefined && typeof item === 'object')
      .filter(item => item.category_id !== undefined) // Ensure category_id exists
      .filter(item => !categoryId || item.category_id === categoryId);
    
    return c.json(items);
  } catch (error: any) {
    console.error("Error fetching items:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-4050140e/items", async (c) => {
  try {
    const data = await c.req.json();
    const id = generateId();
    const item = {
      id,
      names: data.names,
      category_id: data.category_id,
      price: data.price,
      image: data.image,
      tags: data.tags || [],
      variants: data.variants || undefined, // Support variants
      created_at: new Date().toISOString(),
    };
    
    await kv.set(`piko:item:${id}`, item);
    
    const itemIds = await kv.get("piko:item-ids") || [];
    itemIds.push(id);
    await kv.set("piko:item-ids", itemIds);
    
    return c.json(item);
  } catch (error: any) {
    console.error("Error creating item:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.put("/make-server-4050140e/items/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    
    const existing = await kv.get(`piko:item:${id}`);
    if (!existing) {
      return c.json({ error: "Item not found" }, 404);
    }
    
    const item = {
      ...existing,
      names: data.names,
      category_id: data.category_id,
      price: data.price,
      image: data.image,
      tags: data.tags || [],
      variants: data.variants || existing.variants || undefined, // Support variants
    };
    
    await kv.set(`piko:item:${id}`, item);
    return c.json(item);
  } catch (error: any) {
    console.error("Error updating item:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete("/make-server-4050140e/items/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    // Get the item before deleting
    const item = await kv.get(`piko:item:${id}`);
    if (!item) {
      return c.json({ error: "Item not found" }, 404);
    }
    
    // Archive the item (soft delete)
    const archivedItem = {
      ...item,
      deleted_at: new Date().toISOString(),
      deleted_by: "admin", // Could be extracted from auth token
    };
    
    await kv.set(`piko:archive:item:${id}`, archivedItem);
    
    // Add to archive index
    const archiveIds = await kv.get("piko:archive-item-ids") || [];
    if (!archiveIds.includes(id)) {
      archiveIds.push(id);
      await kv.set("piko:archive-item-ids", archiveIds);
    }
    
    // Remove from active items
    await kv.del(`piko:item:${id}`);
    
    const itemIds = await kv.get("piko:item-ids") || [];
    const updatedIds = itemIds.filter((iid: string) => iid !== id);
    await kv.set("piko:item-ids", updatedIds);
    
    console.log(`✅ Item archived: ${item.names.en}`);
    return c.json({ success: true, archived: true });
  } catch (error: any) {
    console.error("Error deleting item:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Orders endpoints
app.get("/make-server-4050140e/orders", async (c) => {
  try {
    const orderIds = await kv.get("piko:order-ids") || [];
    const orders = [];
    
    for (const id of orderIds) {
      const order = await kv.get(`piko:order:${id}`);
      if (order) orders.push(order);
    }
    
    orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return c.json(orders);
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-4050140e/orders", async (c) => {
  try {
    const data = await c.req.json();
    const id = generateId();
    const order = {
      id,
      items: data.items,
      total: data.total,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    
    await kv.set(`piko:order:${id}`, order);
    
    const orderIds = await kv.get("piko:order-ids") || [];
    orderIds.push(id);
    await kv.set("piko:order-ids", orderIds);
    
    return c.json(order);
  } catch (error: any) {
    console.error("Error creating order:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.put("/make-server-4050140e/orders/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const data = await c.req.json();
    
    const existing = await kv.get(`piko:order:${id}`);
    if (!existing) {
      return c.json({ error: "Order not found" }, 404);
    }
    
    const order = {
      ...existing,
      status: data.status,
    };
    
    await kv.set(`piko:order:${id}`, order);
    return c.json(order);
  } catch (error: any) {
    console.error("Error updating order:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Clear ONLY Unsplash images endpoint (preserves uploaded images)
app.delete("/make-server-4050140e/images/clear-all", async (c) => {
  try {
    console.log("🗑️ Clearing ONLY Unsplash images from items and categories...");
    
    // Helper function to check if URL is Unsplash
    const isUnsplashImage = (url: string | null | undefined): boolean => {
      if (!url) return false;
      return url.includes('images.unsplash.com') || url.includes('unsplash.com');
    };
    
    // Clear ONLY Unsplash images from items (preserve uploaded images)
    const itemIds = await kv.get("piko:item-ids") || [];
    let itemsCleared = 0;
    
    for (const id of itemIds) {
      const item = await kv.get(`piko:item:${id}`);
      if (item && item.image && isUnsplashImage(item.image)) {
        await kv.set(`piko:item:${id}`, {
          ...item,
          image: null
        });
        itemsCleared++;
      }
    }
    
    // Clear ONLY Unsplash images from categories (preserve uploaded images)
    const categoryIds = await kv.get("piko:category-ids") || [];
    let categoriesCleared = 0;
    
    for (const id of categoryIds) {
      const category = await kv.get(`piko:category:${id}`);
      if (category && category.image && isUnsplashImage(category.image)) {
        const { image, ...categoryWithoutImage } = category;
        await kv.set(`piko:category:${id}`, categoryWithoutImage);
        categoriesCleared++;
      }
    }
    
    console.log(`✅ Cleared Unsplash images from ${itemsCleared} items and ${categoriesCleared} categories (uploaded images preserved)`);
    return c.json({ 
      success: true, 
      itemsCleared, 
      categoriesCleared 
    });
  } catch (error: any) {
    console.error("Error clearing images:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ==================== ARCHIVE / HISTORY ENDPOINTS ====================

// Get all archived items
app.get("/make-server-4050140e/archive/items", async (c) => {
  try {
    const archiveIds = await kv.get("piko:archive-item-ids") || [];
    const archivedItems = [];
    
    for (const id of archiveIds) {
      const item = await kv.get(`piko:archive:item:${id}`);
      if (item) archivedItems.push(item);
    }
    
    // Sort by deletion date (newest first)
    archivedItems.sort((a, b) => 
      new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime()
    );
    
    return c.json(archivedItems);
  } catch (error: any) {
    console.error("Error fetching archived items:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Get all archived categories
app.get("/make-server-4050140e/archive/categories", async (c) => {
  try {
    const archiveIds = await kv.get("piko:archive-category-ids") || [];
    const archivedCategories = [];
    
    for (const id of archiveIds) {
      const category = await kv.get(`piko:archive:category:${id}`);
      if (category) archivedCategories.push(category);
    }
    
    // Sort by deletion date (newest first)
    archivedCategories.sort((a, b) => 
      new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime()
    );
    
    return c.json(archivedCategories);
  } catch (error: any) {
    console.error("Error fetching archived categories:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Restore archived item
app.post("/make-server-4050140e/archive/restore/item/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    // Get archived item
    const archivedItem = await kv.get(`piko:archive:item:${id}`);
    if (!archivedItem) {
      return c.json({ error: "Archived item not found" }, 404);
    }
    
    // Remove archive metadata
    const { deleted_at, deleted_by, ...item } = archivedItem;
    
    // Restore to active items
    await kv.set(`piko:item:${id}`, item);
    
    // Add back to active item IDs
    const itemIds = await kv.get("piko:item-ids") || [];
    if (!itemIds.includes(id)) {
      itemIds.push(id);
      await kv.set("piko:item-ids", itemIds);
    }
    
    // Remove from archive
    await kv.del(`piko:archive:item:${id}`);
    
    const archiveIds = await kv.get("piko:archive-item-ids") || [];
    const updatedArchiveIds = archiveIds.filter((aid: string) => aid !== id);
    await kv.set("piko:archive-item-ids", updatedArchiveIds);
    
    console.log(`✅ Item restored: ${item.names.en}`);
    return c.json({ success: true, item });
  } catch (error: any) {
    console.error("Error restoring item:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Restore archived category
app.post("/make-server-4050140e/archive/restore/category/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    // Get archived category
    const archivedCategory = await kv.get(`piko:archive:category:${id}`);
    if (!archivedCategory) {
      return c.json({ error: "Archived category not found" }, 404);
    }
    
    // Remove archive metadata
    const { deleted_at, deleted_by, ...category } = archivedCategory;
    
    // Restore to active categories
    await kv.set(`piko:category:${id}`, category);
    
    // Add back to active category IDs
    const categoryIds = await kv.get("piko:category-ids") || [];
    if (!categoryIds.includes(id)) {
      categoryIds.push(id);
      await kv.set("piko:category-ids", categoryIds);
    }
    
    // Remove from archive
    await kv.del(`piko:archive:category:${id}`);
    
    const archiveIds = await kv.get("piko:archive-category-ids") || [];
    const updatedArchiveIds = archiveIds.filter((aid: string) => aid !== id);
    await kv.set("piko:archive-category-ids", updatedArchiveIds);
    
    console.log(`✅ Category restored: ${category.names.en}`);
    return c.json({ success: true, category });
  } catch (error: any) {
    console.error("Error restoring category:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Permanently delete archived item
app.delete("/make-server-4050140e/archive/item/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    // Get archived item for logging
    const archivedItem = await kv.get(`piko:archive:item:${id}`);
    if (!archivedItem) {
      return c.json({ error: "Archived item not found" }, 404);
    }
    
    // Permanently delete from archive
    await kv.del(`piko:archive:item:${id}`);
    
    // Remove from archive index
    const archiveIds = await kv.get("piko:archive-item-ids") || [];
    const updatedArchiveIds = archiveIds.filter((aid: string) => aid !== id);
    await kv.set("piko:archive-item-ids", updatedArchiveIds);
    
    console.log(`🗑️ Item permanently deleted: ${archivedItem.names.en}`);
    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error permanently deleting item:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Permanently delete archived category
app.delete("/make-server-4050140e/archive/category/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    // Get archived category for logging
    const archivedCategory = await kv.get(`piko:archive:category:${id}`);
    if (!archivedCategory) {
      return c.json({ error: "Archived category not found" }, 404);
    }
    
    // Permanently delete from archive
    await kv.del(`piko:archive:category:${id}`);
    
    // Remove from archive index
    const archiveIds = await kv.get("piko:archive-category-ids") || [];
    const updatedArchiveIds = archiveIds.filter((aid: string) => aid !== id);
    await kv.set("piko:archive-category-ids", updatedArchiveIds);
    
    console.log(`🗑️ Category permanently deleted: ${archivedCategory.names.en}`);
    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error permanently deleting category:", error);
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);