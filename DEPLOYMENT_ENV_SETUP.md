# 🚀 Deployment Environment Variables Setup

## Problem

The localhost works because it has `.env.local` file, but the deployment doesn't have the environment variables configured, causing the admin panel to run in "static mode".

## Solution: Configure Vercel Environment Variables

### Step 1: Access Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your project: **piko-cafe-digital-menu**
3. Click on the project name

### Step 2: Add Environment Variables

1. Go to **Settings** tab
2. Click **Environment Variables** in the left sidebar
3. Add these 4 variables:

#### Required Environment Variables:

| Variable Name            | Value                                                                                                                                                                                                              | Environment                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| `VITE_SUPABASE_URL`      | `https://jppymhzgprvshurcqmdn.supabase.co`                                                                                                                                                                         | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwcHltaHpncHJ2c2h1cmNxbWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODM0NzIsImV4cCI6MjA3NjY1OTQ3Mn0.SkAnsUjAgamEZxNBAXciJVSlAvWH4wji4lJrEYq-1uA` | Production, Preview, Development |
| `VITE_DATA_SOURCE`       | `database`                                                                                                                                                                                                         | Production, Preview, Development |
| `VITE_ADMIN_MODE`        | `true`                                                                                                                                                                                                             | Production, Preview, Development |

### Step 3: Redeploy

1. After adding all variables, go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger automatic deployment

### Step 4: Verify

1. Check the deployment URL
2. Navigate to admin panel
3. Try category/item operations
4. Check browser console for debug logs

## Alternative: Vercel CLI (if you prefer command line)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_DATA_SOURCE
vercel env add VITE_ADMIN_MODE

# Deploy
vercel --prod
```

## Expected Result

After configuration, the deployment should:

- ✅ Load data from Supabase database (not static mode)
- ✅ Allow admin panel operations (create, edit, delete, reorder)
- ✅ Show debug logs in browser console confirming database mode
- ✅ No more "Categories API disabled in static mode" errors

## Debugging

If issues persist, check browser console for these debug logs:

- 🔍 Static mode detection
- 🔧 Admin mode override
- 📊 Data source check
- 🔗 Supabase config check
