import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js';

// Password hashing utilities with PBKDF2 and salt
async function generateSalt(): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(salt, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string, salt?: string): Promise<string> {
  const usedSalt = salt || (await generateSalt());
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  const saltData = encoder.encode(usedSalt);

  // Use PBKDF2 with 100,000 iterations for security
  const key = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltData,
      iterations: 100000,
      hash: 'SHA-256',
    },
    key,
    256
  );

  const hash = Array.from(new Uint8Array(derivedBits), byte =>
    byte.toString(16).padStart(2, '0')
  ).join('');

  // Return salt:hash format for storage
  return `${usedSalt}:${hash}`;
}

async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;

    const newHash = await hashPassword(password, salt);
    const [, newHashOnly] = newHash.split(':');
    return newHashOnly === hash;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

const app = new Hono();

// Supabase admin client for auth
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS with environment-based whitelist
const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://localhost:3000',
  'https://localhost:5173',
];

app.use(
  '/*',
  cors({
    origin: origin => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return true;

      // Check if origin is in allowed list
      const isAllowed = allowedOrigins.some(
        allowed =>
          origin === allowed ||
          origin.endsWith(
            allowed.replace('http://', '').replace('https://', '')
          )
      );

      if (!isAllowed) {
        console.warn('🚫 CORS blocked origin:', origin);
      }

      return isAllowed;
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
  })
);

// Helper function to generate UUID (currently unused)
// function _generateId() {
//   return crypto.randomUUID();
// }

// Helper function to create slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Input validation helpers
function sanitizeString(input: string, maxLength: number = 255): string {
  return input.trim().slice(0, maxLength).replace(/[<>]/g, ''); // Basic XSS protection
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

function validatePassword(password: string): {
  valid: boolean;
  error?: string;
} {
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password must be less than 128 characters' };
  }
  return { valid: true };
}

function validatePrice(price: number): { valid: boolean; error?: string } {
  if (typeof price !== 'number' || isNaN(price)) {
    return { valid: false, error: 'Price must be a valid number' };
  }
  if (price < 0) {
    return { valid: false, error: 'Price must be positive' };
  }
  if (price > 999999) {
    return { valid: false, error: 'Price must be less than 999,999' };
  }
  return { valid: true };
}

function validateImageData(imageData: string): {
  valid: boolean;
  error?: string;
} {
  if (!imageData) return { valid: true }; // Optional field

  // Check if it's base64 data URL
  if (!imageData.startsWith('data:image/')) {
    return { valid: false, error: 'Image must be a valid data URL' };
  }

  // Check size (max 5MB)
  const sizeInBytes = (imageData.length * 3) / 4;
  if (sizeInBytes > 5 * 1024 * 1024) {
    return { valid: false, error: 'Image must be less than 5MB' };
  }

  return { valid: true };
}

// Health check endpoint
app.get('/make-server-4050140e/health', c => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoint to test database connection
app.get('/make-server-4050140e/debug/db', async c => {
  try {
    console.log('🔍 Testing database connection...');
    const { data: users, error } = await supabase
      .from('user_credentials')
      .select('email, name')
      .limit(3);

    if (error) {
      console.error('❌ Database error:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log('✅ Database connection successful:', users);
    return c.json({
      success: true,
      users,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('💥 Debug error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Debug endpoint to check specific user credentials
app.post('/make-server-4050140e/debug/user', async c => {
  try {
    const { email } = await c.req.json();
    console.log('🔍 Checking user credentials for:', email);

    const { data: userCredentials, error } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('❌ User lookup error:', error);
      return c.json({ error: error.message, found: false }, 404);
    }

    console.log('✅ User found:', userCredentials.email);
    return c.json({
      success: true,
      user: {
        email: userCredentials.email,
        name: userCredentials.name,
        hasPassword: !!userCredentials.password_hash,
      },
    });
  } catch (error: any) {
    console.error('💥 User debug error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Ensure admin credentials exist (can be called anytime)
app.post('/make-server-4050140e/ensure-admin', async c => {
  try {
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@piko.com';
    const adminPassword = Deno.env.get('ADMIN_PASSWORD') || 'admin123';

    // Warn if using default credentials
    if (adminEmail === 'admin@piko.com' || adminPassword === 'admin123') {
      console.warn(
        '⚠️ Using default admin credentials. Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables for production.'
      );
    }

    // Check if admin user already exists
    const { data: existingAdmin } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', adminEmail)
      .eq('is_admin', true)
      .single();

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return c.json({
        success: true,
        verified: true,
        email: existingAdmin.email,
      });
    }

    console.log('👤 Creating admin user in Supabase Auth...');

    // Create admin user in Supabase Auth
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
      });

    if (authError || !authUser.user) {
      console.error('❌ Admin auth creation failed:', authError);
      return c.json({ error: 'Failed to create admin user' }, 500);
    }

    console.log('✅ Admin auth user created:', authUser.user.id);

    // Create admin profile
    console.log('👤 Creating admin profile...');
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authUser.user.id,
      email: adminEmail,
      name: 'Admin',
      is_admin: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error('❌ Admin profile creation failed:', profileError);
      // Try to clean up the auth user
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return c.json({ error: 'Failed to create admin profile' }, 500);
    }

    console.log('✅ Admin profile created');

    return c.json({
      success: true,
      message: 'Admin user created successfully',
      admin: {
        id: authUser.user.id,
        email: adminEmail,
        name: 'Admin',
      },
    });
  } catch (error: any) {
    console.error('Error ensuring admin credentials:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Sign up endpoint
app.post('/make-server-4050140e/auth/signup', async c => {
  try {
    console.log('=== SIGNUP ENDPOINT HIT ===');
    const body = await c.req.json();
    console.log('Signup request body:', JSON.stringify(body));

    const { email, password, name } = body;
    console.log('Signup attempt for email:', email, 'name:', name);

    // Validate input
    if (!email || !password || !name) {
      console.log('❌ Missing required fields:', {
        email: !!email,
        password: !!password,
        name: !!name,
      });
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeString(email, 255);
    const sanitizedName = sanitizeString(name, 100);

    // Validate email format
    if (!validateEmail(sanitizedEmail)) {
      console.log('❌ Invalid email format');
      return c.json({ error: 'Please enter a valid email address' }, 400);
    }

    // Validate name length
    if (sanitizedName.length < 2) {
      console.log('❌ Name too short');
      return c.json({ error: 'Name must be at least 2 characters' }, 400);
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      console.log('❌ Password validation failed:', passwordValidation.error);
      return c.json({ error: passwordValidation.error }, 400);
    }

    // Check if user already exists in database
    console.log('🔍 Checking if user exists in database...');
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      console.log('❌ User already exists');
      return c.json({ error: 'User with this email already exists' }, 409);
    }

    // Create user in Supabase Auth first
    console.log('✅ Creating user in Supabase Auth...');
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: sanitizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          name: sanitizedName,
        },
      });

    if (authError || !authUser.user) {
      console.error('❌ Auth user creation failed:', authError);
      return c.json({ error: 'Failed to create user account' }, 500);
    }

    // Create profile in database
    console.log('✅ Creating profile in database...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email: sanitizedEmail,
        name: sanitizedName,
        is_admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError);
      // Try to clean up the auth user
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return c.json({ error: 'Failed to create user profile' }, 500);
    }

    // Hash password before storing
    console.log('🔐 Hashing password...');
    const passwordHash = await hashPassword(password);

    // Store user credentials in database for password verification
    console.log('💾 Storing user credentials in database...');
    const { error: credentialsError } = await supabase
      .from('user_credentials')
      .insert({
        user_id: authUser.user.id,
        email: sanitizedEmail,
        password_hash: passwordHash,
        name: sanitizedName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (credentialsError) {
      console.error('❌ User credentials storage failed:', credentialsError);
      // Try to clean up the auth user and profile
      await supabase.auth.admin.deleteUser(authUser.user.id);
      await supabase.from('profiles').delete().eq('id', authUser.user.id);
      return c.json({ error: 'Failed to store user credentials' }, 500);
    }

    console.log('✅ User credentials stored in database');

    // Generate session token for our custom session management
    console.log('🔑 Generating session token...');
    const sessionToken = crypto.randomUUID();

    // Store session in database for persistence
    console.log('💾 Saving session to database...');
    const { error: sessionError } = await supabase.from('sessions').insert({
      token: sessionToken,
      user_id: authUser.user.id,
      email: sanitizedEmail,
      name: sanitizedName,
      is_admin: false,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    });

    if (sessionError) {
      console.error('❌ Session creation failed:', sessionError);
      return c.json({ error: 'Failed to create session' }, 500);
    }

    console.log('✅ Session created for:', email);

    console.log('🎉 Signup complete, returning response...');
    const response = {
      data: {
        session: {
          access_token: sessionToken,
          user: {
            email: sanitizedEmail,
            name: sanitizedName,
            id: authUser.user.id,
            isAdmin: false,
          },
        },
      },
      error: null,
    };
    console.log('Response to send:', JSON.stringify(response));
    return c.json(response);
  } catch (error: any) {
    console.error('Signup error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error type:', typeof error);
    return c.json(
      {
        error: error.message || 'Signup failed',
        details: String(error),
      },
      500
    );
  }
});

// Get session endpoint with enhanced expiration validation
app.get('/make-server-4050140e/auth/session', async c => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      console.log('❌ No token provided');
      return c.json({ data: { session: null }, error: null });
    }

    console.log(
      '🔍 Checking session for token:',
      `${token.substring(0, 8)}...`
    );

    // Check session in database with strict expiration validation
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !session) {
      console.log('❌ Session not found:', error?.message);
      return c.json({ data: { session: null }, error: null });
    }

    // Enhanced expiration check with current time comparison
    const now = new Date();
    const expiresAt = new Date(session.expires_at);

    if (now >= expiresAt) {
      console.log('❌ Session expired:', {
        now: now.toISOString(),
        expires: expiresAt.toISOString(),
        expired: now >= expiresAt,
      });

      // Clean up expired session
      await supabase.from('sessions').delete().eq('token', token);

      return c.json({ data: { session: null }, error: null });
    }

    console.log('✅ Session found and valid:', session.email);

    return c.json({
      data: {
        session: {
          access_token: token,
          user: {
            email: session.email,
            name: session.name,
            id: session.user_id,
            isAdmin: session.is_admin,
          },
        },
      },
      error: null,
    });
  } catch (error: any) {
    console.error('❌ Session check error:', error);
    return c.json({ data: { session: null }, error: null });
  }
});

// Logout endpoint
app.post('/make-server-4050140e/auth/logout', async c => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      // Delete session from database
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('token', token);

      if (error) {
        console.error('Error deleting session:', error);
      } else {
        console.log('Session deleted:', token);
      }
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Logout error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Login endpoint
app.post('/make-server-4050140e/auth/login', async c => {
  try {
    const { email, password } = await c.req.json();
    console.log('🔐 Login attempt for:', email);
    console.log('🔐 Password provided:', password ? 'Yes' : 'No');
    console.log('🔐 Password length:', password ? password.length : 0);

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeString(email, 255);

    // Validate email format
    if (!validateEmail(sanitizedEmail)) {
      console.log('❌ Invalid email format');
      return c.json({ error: 'Please enter a valid email address' }, 400);
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      console.log('❌ Password validation failed:', passwordValidation.error);
      return c.json({ error: passwordValidation.error }, 400);
    }

    // Check admin credentials in database
    console.log('🔍 Checking admin credentials in database...');
    const { data: adminUser, error: adminError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', sanitizedEmail)
      .eq('is_admin', true)
      .single();

    if (!adminError && adminUser) {
      const adminPassword = Deno.env.get('ADMIN_PASSWORD') || 'admin123';

      // For demo purposes, we'll use a simple password check
      // In production, you should hash passwords
      if (password === adminPassword) {
        // Generate a session token
        const sessionToken = crypto.randomUUID();

        // Store session in database for persistence
        console.log('💾 Saving admin session to database...');
        const { error: sessionError } = await supabase.from('sessions').insert({
          token: sessionToken,
          user_id: adminUser.id,
          email: sanitizedEmail,
          name: 'Admin',
          is_admin: true,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        });

        if (sessionError) {
          console.error('❌ Admin session creation failed:', sessionError);
          return c.json({ error: 'Failed to create session' }, 500);
        }

        console.log('✅ Admin login successful for:', email);

        return c.json({
          data: {
            session: {
              access_token: sessionToken,
              user: { email: sanitizedEmail, name: 'Admin', isAdmin: true },
            },
          },
          error: null,
        });
      }
    }

    // Check regular user credentials in database
    console.log('🔍 Checking regular user credentials in database...');
    const { data: userCredentials, error: credentialsError } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('email', sanitizedEmail)
      .single();

    console.log('🔍 Database query result:', {
      hasData: !!userCredentials,
      hasError: !!credentialsError,
      errorMessage: credentialsError?.message,
    });

    if (credentialsError || !userCredentials) {
      console.log('❌ User not found for:', sanitizedEmail);
      console.log('❌ Error details:', credentialsError);
      return c.json(
        { error: 'Invalid credentials. Please check your email or sign up.' },
        401
      );
    }

    console.log('✅ User found in database:', userCredentials.email);
    console.log(
      '✅ User password hash:',
      userCredentials.password_hash ? 'Present' : 'Missing'
    );

    // Verify password using hashed comparison
    console.log('🔍 Verifying password hash...');
    const passwordMatch = await verifyPassword(
      password,
      userCredentials.password_hash
    );
    console.log('🔍 Password match:', passwordMatch ? 'Yes' : 'No');

    if (passwordMatch) {
      // Generate a session token
      const sessionToken = crypto.randomUUID();

      // Store session in database for persistence
      console.log('💾 Saving session to database...');
      const { error: sessionError } = await supabase.from('sessions').insert({
        token: sessionToken,
        user_id: userCredentials.user_id,
        email: sanitizedEmail,
        name: userCredentials.name,
        is_admin: false,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      });

      if (sessionError) {
        console.error('❌ Session creation failed:', sessionError);
        return c.json({ error: 'Failed to create session' }, 500);
      }

      console.log('✅ User login successful for:', sanitizedEmail);

      return c.json({
        data: {
          session: {
            access_token: sessionToken,
            user: {
              email: sanitizedEmail,
              name: userCredentials.name,
              id: userCredentials.user_id,
              isAdmin: false,
            },
          },
        },
        error: null,
      });
    } else {
      console.log('❌ Password mismatch');
      return c.json(
        { error: 'Invalid credentials. Please check your email or sign up.' },
        401
      );
    }
  } catch (error: any) {
    console.error('💥 Login error:', error);
    return c.json({ error: error.message || 'Login failed' }, 500);
  }
});

// Categories endpoints - Using relational database
app.get('/make-server-4050140e/categories', async c => {
  try {
    // Use simplified JSONB structure
    const { data: categories, error } = await supabase
      .from('categories')
      .select(
        `
        id,
        slug,
        names,
        icon,
        color,
        image_url,
        sort_order,
        is_active,
        created_at
      `
      )
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('Error fetching categories:', error);
      return c.json({ error: error.message }, 500);
    }

    // Transform to expected format
    const transformedCategories = categories.map(cat => ({
      id: cat.id,
      names: cat.names || { en: 'Category', tr: 'Kategori', ar: 'فئة' },
      icon: cat.icon || '🍽️',
      color: cat.color,
      image: cat.image_url,
      order: cat.sort_order,
      created_at: cat.created_at,
    }));

    return c.json(transformedCategories);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Create category endpoint
app.post('/make-server-4050140e/categories', async c => {
  try {
    const body = await c.req.json();
    console.log('Creating category with data:', body);

    const { names, icon, image, color, order } = body;

    // Validate input
    if (!names || !names.en) {
      return c.json({ error: 'English name is required' }, 400);
    }

    // Sanitize inputs
    const sanitizedNames = {
      en: sanitizeString(names.en, 100),
      tr: names.tr ? sanitizeString(names.tr, 100) : names.en,
      ar: names.ar ? sanitizeString(names.ar, 100) : names.en,
    };

    const sanitizedIcon = sanitizeString(icon || '🍽️', 10);
    const sanitizedColor = sanitizeString(color || '#0C6071', 20);

    // Validate image data
    if (image) {
      const imageValidation = validateImageData(image);
      if (!imageValidation.valid) {
        return c.json({ error: imageValidation.error }, 400);
      }
    }

    // Validate order
    const orderNum = typeof order === 'number' ? order : 0;
    if (orderNum < 0 || orderNum > 9999) {
      return c.json({ error: 'Order must be between 0 and 9999' }, 400);
    }

    // Generate slug from English name
    const slug = createSlug(sanitizedNames.en);

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        slug,
        names: sanitizedNames,
        icon: sanitizedIcon,
        image_url: image,
        color: sanitizedColor,
        sort_order: orderNum,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return c.json({ error: error.message }, 500);
    }

    // Transform to expected format
    const transformedCategory = {
      id: category.id,
      names: category.names,
      icon: category.icon,
      color: category.color,
      image: category.image_url,
      order: category.sort_order,
      created_at: category.created_at,
    };

    console.log('Category created successfully:', transformedCategory);
    return c.json(transformedCategory);
  } catch (error: any) {
    console.error('Error creating category:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Update category endpoint
app.put('/make-server-4050140e/categories/:id', async c => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    console.log(`Updating category ${id} with data:`, body);

    const { names, icon, image, color, order } = body;

    // Update slug if English name changed
    const updateData: any = {
      names,
      icon: icon || '🍽️',
      image_url: image,
      color: color || '#0C6071',
      sort_order: order || 0,
      updated_at: new Date().toISOString(),
    };

    if (names?.en) {
      updateData.slug = createSlug(names.en);
    }

    const { data: category, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return c.json({ error: error.message }, 500);
    }

    // Transform to expected format
    const transformedCategory = {
      id: category.id,
      names: category.names,
      icon: category.icon,
      color: category.color,
      image: category.image_url,
      order: category.sort_order,
      created_at: category.created_at,
    };

    console.log('Category updated successfully:', transformedCategory);
    return c.json(transformedCategory);
  } catch (error: any) {
    console.error('Error updating category:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete category endpoint
app.delete('/make-server-4050140e/categories/:id', async c => {
  try {
    const id = c.req.param('id');
    console.log(`Deleting category ${id}`);

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('categories')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log('Category deleted successfully');
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Items endpoints
app.get('/make-server-4050140e/items', async c => {
  try {
    const categoryId = c.req.query('category_id');

    // Use simplified JSONB structure
    let query = supabase
      .from('items')
      .select(
        `
        id,
        category_id,
        names,
        descriptions,
        price,
        image_url,
        tags,
        variants,
        is_active,
        sort_order,
        created_at
      `
      )
      .eq('is_active', true);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data: items, error } = await query.order('sort_order');

    if (error) {
      console.error('Error fetching items:', error);
      return c.json({ error: error.message }, 500);
    }

    // Transform to expected format
    const transformedItems = items.map(item => ({
      id: item.id,
      names: item.names || { en: 'Item', tr: 'Ürün', ar: 'منتج' },
      descriptions: item.descriptions || null,
      category_id: item.category_id,
      price: item.price || 0,
      image: item.image_url,
      variants:
        item.variants &&
        Array.isArray(item.variants) &&
        item.variants.length > 0
          ? item.variants
          : undefined,
      tags: item.tags || ['menu-item'],
      is_available: item.is_active,
      order: item.sort_order || 0,
      created_at: item.created_at,
    }));

    return c.json(transformedItems);
  } catch (error: any) {
    console.error('Error fetching items:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Create item endpoint
app.post('/make-server-4050140e/items', async c => {
  try {
    const body = await c.req.json();
    console.log('Creating item with data:', body);

    const {
      names,
      descriptions,
      category_id,
      price,
      image,
      tags,
      variants,
      order,
    } = body;

    // Validate input
    if (!names || !names.en) {
      return c.json({ error: 'English name is required' }, 400);
    }

    if (!category_id) {
      return c.json({ error: 'Category ID is required' }, 400);
    }

    // Sanitize inputs
    const sanitizedNames = {
      en: sanitizeString(names.en, 100),
      tr: names.tr ? sanitizeString(names.tr, 100) : names.en,
      ar: names.ar ? sanitizeString(names.ar, 100) : names.en,
    };

    const sanitizedDescriptions = descriptions
      ? {
          en: descriptions.en
            ? sanitizeString(descriptions.en, 500)
            : undefined,
          tr: descriptions.tr
            ? sanitizeString(descriptions.tr, 500)
            : undefined,
          ar: descriptions.ar
            ? sanitizeString(descriptions.ar, 500)
            : undefined,
        }
      : undefined;

    // Validate price
    const priceValidation = validatePrice(price || 0);
    if (!priceValidation.valid) {
      return c.json({ error: priceValidation.error }, 400);
    }

    // Validate image data
    if (image) {
      const imageValidation = validateImageData(image);
      if (!imageValidation.valid) {
        return c.json({ error: imageValidation.error }, 400);
      }
    }

    // Validate tags
    const sanitizedTags = Array.isArray(tags)
      ? tags.map(tag => sanitizeString(tag, 50)).filter(tag => tag.length > 0)
      : ['menu-item'];

    // Validate variants
    let sanitizedVariants = [];
    if (variants && Array.isArray(variants)) {
      sanitizedVariants = variants
        .map(variant => ({
          size: sanitizeString(variant.size, 50),
          price: validatePrice(variant.price).valid ? variant.price : 0,
        }))
        .filter(variant => variant.size && variant.price >= 0);
    }

    // Validate order
    const orderNum = typeof order === 'number' ? order : 0;
    if (orderNum < 0 || orderNum > 9999) {
      return c.json({ error: 'Order must be between 0 and 9999' }, 400);
    }

    const { data: item, error } = await supabase
      .from('items')
      .insert({
        category_id,
        names: sanitizedNames,
        descriptions: sanitizedDescriptions,
        price: price || 0,
        image_url: image,
        tags: sanitizedTags,
        variants: sanitizedVariants,
        is_active: true,
        sort_order: orderNum,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating item:', error);
      return c.json({ error: error.message }, 500);
    }

    // Transform to expected format
    const transformedItem = {
      id: item.id,
      names: item.names,
      descriptions: item.descriptions,
      category_id: item.category_id,
      price: item.price,
      image: item.image_url,
      variants: item.variants,
      tags: item.tags,
      is_available: item.is_active,
      order: item.sort_order || 0,
      created_at: item.created_at,
    };

    console.log('Item created successfully:', transformedItem);
    return c.json(transformedItem);
  } catch (error: any) {
    console.error('Error creating item:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Update item endpoint
app.put('/make-server-4050140e/items/:id', async c => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    console.log(`Updating item ${id} with data:`, body);

    const {
      names,
      descriptions,
      category_id,
      price,
      image,
      tags,
      variants,
      order,
    } = body;

    const { data: item, error } = await supabase
      .from('items')
      .update({
        category_id,
        names,
        descriptions,
        price: price || 0,
        image_url: image,
        tags: tags || ['menu-item'],
        variants: variants || [],
        sort_order: order !== undefined ? order : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating item:', error);
      return c.json({ error: error.message }, 500);
    }

    // Transform to expected format
    const transformedItem = {
      id: item.id,
      names: item.names,
      descriptions: item.descriptions,
      category_id: item.category_id,
      price: item.price,
      image: item.image_url,
      variants: item.variants,
      tags: item.tags,
      is_available: item.is_active,
      order: item.sort_order || 0,
      created_at: item.created_at,
    };

    console.log('Item updated successfully:', transformedItem);
    return c.json(transformedItem);
  } catch (error: any) {
    console.error('Error updating item:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete item endpoint
app.delete('/make-server-4050140e/items/:id', async c => {
  try {
    const id = c.req.param('id');
    console.log(`Deleting item ${id}`);

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('items')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error deleting item:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log('Item deleted successfully');
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting item:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Bulk delete all items endpoint
app.delete('/make-server-4050140e/items/bulk/delete-all', async c => {
  try {
    console.log('Bulk deleting all items');

    // Soft delete all items by setting is_active to false
    const { error } = await supabase.from('items').update({
      is_active: false,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error bulk deleting items:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log('All items deleted successfully');
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Error bulk deleting items:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Bulk create items endpoint
app.post('/make-server-4050140e/items/bulk/create', async c => {
  try {
    const { items } = await c.req.json();
    console.log(`Bulk creating ${items.length} items`);

    const itemsToInsert = items.map((item: any) => ({
      category_id: item.category_id,
      names: item.names,
      descriptions: item.descriptions,
      price: item.price || 0,
      image_url: item.image,
      tags: item.tags || ['menu-item'],
      variants: item.variants || [],
      is_active: true,
      sort_order: 0,
      created_at: new Date().toISOString(),
    }));

    const { data: createdItems, error } = await supabase
      .from('items')
      .insert(itemsToInsert)
      .select();

    if (error) {
      console.error('Error bulk creating items:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log(`${createdItems.length} items created successfully`);
    return c.json({ success: true, count: createdItems.length });
  } catch (error: any) {
    console.error('Error bulk creating items:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Bulk update item order endpoint
app.put('/make-server-4050140e/items/bulk/update-order', async c => {
  try {
    const { orderUpdates } = await c.req.json();
    console.log(`Bulk updating order for ${orderUpdates.length} items`);

    // Update each item's sort_order
    const updatePromises = orderUpdates.map(
      (update: { id: string; order: number }) =>
        supabase
          .from('items')
          .update({
            sort_order: update.order,
            updated_at: new Date().toISOString(),
          })
          .eq('id', update.id)
    );

    const results = await Promise.all(updatePromises);

    // Check for any errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Error updating item orders:', errors);
      return c.json({ error: 'Failed to update some item orders' }, 500);
    }

    console.log(`Successfully updated order for ${orderUpdates.length} items`);
    return c.json({ success: true, count: orderUpdates.length });
  } catch (error: any) {
    console.error('Error bulk updating item order:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Transaction-based batch update item order endpoint
app.put('/make-server-4050140e/items/batch/update-order', async c => {
  try {
    const { orderUpdates, categoryId, useTransaction } = await c.req.json();
    console.log(
      `Transaction-based batch updating order for ${orderUpdates.length} items in category ${categoryId}`
    );

    if (useTransaction) {
      // Use a transaction for atomic updates
      const { data, error } = await supabase.rpc('batch_update_item_order', {
        order_updates: orderUpdates,
        category_id: categoryId,
      });

      if (error) {
        console.error('Transaction error:', error);
        return c.json(
          { error: 'Failed to update item orders in transaction' },
          500
        );
      }

      console.log(
        `Successfully updated order for ${orderUpdates.length} items using transaction`
      );
      return c.json({
        success: true,
        count: orderUpdates.length,
        transaction: true,
      });
    } else {
      // Fallback to individual updates
      const updatePromises = orderUpdates.map(
        (update: { id: string; order: number }) =>
          supabase
            .from('items')
            .update({
              sort_order: update.order,
              updated_at: new Date().toISOString(),
            })
            .eq('id', update.id)
      );

      const results = await Promise.all(updatePromises);
      const errors = results.filter(result => result.error);

      if (errors.length > 0) {
        console.error('Error updating item orders:', errors);
        return c.json({ error: 'Failed to update some item orders' }, 500);
      }

      console.log(
        `Successfully updated order for ${orderUpdates.length} items`
      );
      return c.json({
        success: true,
        count: orderUpdates.length,
        transaction: false,
      });
    }
  } catch (error: any) {
    console.error('Error batch updating item order:', error);
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);
