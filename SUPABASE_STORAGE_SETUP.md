# 🔧 Supabase Storage Setup Guide

## ❌ Current Issue

Image uploads are not working because the `menu-images` storage bucket doesn't exist in your Supabase project.

## ✅ Solution: Create Storage Bucket

### Step 1: Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `eoaissoqwlfvfizfomax`

### Step 2: Create Storage Bucket

1. In the left sidebar, click **"Storage"**
2. Click **"New bucket"**
3. Set the bucket name: `menu-images`
4. Set it as **Public** (so images can be accessed without authentication)
5. Click **"Create bucket"**

### Step 3: Configure Bucket Policies

1. Go to **"Storage"** → **"Policies"**
2. Click **"New Policy"** for the `menu-images` bucket
3. Add these policies:

#### Policy 1: Allow public read access

```sql
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'menu-images');
```

#### Policy 2: Allow authenticated users to upload

```sql
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'menu-images' AND auth.role() = 'authenticated');
```

#### Policy 3: Allow authenticated users to update

```sql
CREATE POLICY "Authenticated users can update" ON storage.objects
FOR UPDATE USING (bucket_id = 'menu-images' AND auth.role() = 'authenticated');
```

#### Policy 4: Allow authenticated users to delete

```sql
CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE USING (bucket_id = 'menu-images' AND auth.role() = 'authenticated');
```

### Step 4: Test the Setup

1. Go to your app: http://localhost:3002
2. Navigate to Admin Panel: http://localhost:3002/admin-login
3. Login with: `admin@piko.com` / `admin123`
4. Try uploading an image for a category or item

## 🔄 Alternative: Use Base64 Encoding

If you prefer not to use Supabase Storage, the app will automatically fall back to base64 encoding (storing images as text in the database).

## 🎯 Expected Result

After setup, image uploads should work seamlessly with:

- ✅ Images stored in Supabase Storage
- ✅ Public URLs generated automatically
- ✅ Fast loading and optimized delivery
- ✅ No file size limits (up to 5MB per image)

## 🆘 Need Help?

If you encounter issues:

1. Check the browser console for error messages
2. Verify the bucket is set to "Public"
3. Ensure the policies are correctly applied
4. Test with a small image file first
