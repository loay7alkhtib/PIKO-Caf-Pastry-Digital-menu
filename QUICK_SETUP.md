# 🚀 Quick Vercel Environment Variables Setup

## Step-by-Step Instructions

### 1. Go to Vercel Dashboard

- Open: https://vercel.com/dashboard
- Find your project: **piko-cafe-digital-menu**
- Click on the project name

### 2. Add Environment Variables

- Click **Settings** tab
- Click **Environment Variables** (left sidebar)
- Click **Add New** button

### 3. Add These 4 Variables (Copy & Paste)

#### Variable 1:

- **Name:** `VITE_SUPABASE_URL`
- **Value:** `https://jppymhzgprvshurcqmdn.supabase.co`
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**

#### Variable 2:

- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcHltaHpncHJ2c2h1cmNxbWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODM0NzIsImV4cCI6MjA3NjY1OTQ3Mn0.SkAnsUjAgamEZxNBAXciJVSlAvWH4wji4lJrEYq-1uA`
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**

#### Variable 3:

- **Name:** `VITE_DATA_SOURCE`
- **Value:** `database`
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**

#### Variable 4:

- **Name:** `VITE_ADMIN_MODE`
- **Value:** `true`
- **Environment:** Select all (Production, Preview, Development)
- Click **Save**

### 4. Redeploy

- Go to **Deployments** tab
- Click **Redeploy** on the latest deployment
- Wait for deployment to complete

### 5. Test

- Open your deployment URL
- Navigate to admin panel
- Try creating/editing categories or items
- Check browser console for debug logs

## ✅ Expected Result

After setup, you should see:

- No more "static mode" errors
- Admin panel works fully
- Data loads from Supabase database
- Debug logs show "Admin mode override: disabling static mode"

## 🔧 If You Need Help

1. Take a screenshot of your Vercel Environment Variables page
2. Check browser console for debug logs (F12 → Console)
3. Verify all 4 variables are added correctly
