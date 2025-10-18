# PIKO Café & Pastry Digital Menu - Vercel Deployment Guide

## 🚀 Quick Deployment Steps

### Prerequisites

- [Vercel account](https://vercel.com) (free tier available)
- [GitHub account](https://github.com) (if not already connected)
- Your project pushed to GitHub repository

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub**

   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin Piko-2-Branch
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "New Project"
   - Import your GitHub repository
   - Select the `Piko-2-Branch` branch

3. **Configure Environment Variables**
   - In Vercel dashboard, go to your project settings
   - Navigate to "Environment Variables"
   - Add the following variables:
     ```
     VITE_SUPABASE_URL = https://eoaissoqwlfvfizfomax.supabase.co
     VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYWlzc29xd2xmdmZpemZvbWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTY5OTIsImV4cCI6MjA3NTMzMjk5Mn0.SHkFV9EvSnWVmC0tApVU6A6C1rrDqsPMO922rMC1JpY
     ```

4. **Deploy**
   - Click "Deploy" button
   - Wait for the build to complete
   - Your app will be live at `https://your-project-name.vercel.app`

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy from your project directory**

   ```bash
   vercel
   ```

4. **Set environment variables**

   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

5. **Redeploy with environment variables**
   ```bash
   vercel --prod
   ```

## 🔧 Configuration Details

### Build Settings

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

### Environment Variables Required

```
VITE_SUPABASE_URL=https://eoaissoqwlfvfizfomax.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYWlzc29xd2xmdmZpemZvbWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTY5OTIsImV4cCI6MjA3NTMzMjk5Mn0.SHkFV9EvSnWVmC0tApVU6A6C1rrDqsPMO922rMC1JpY
```

## 🛠️ Troubleshooting

### Common Issues

1. **Build Fails**
   - Check that all dependencies are in `package.json`
   - Ensure TypeScript compilation passes: `npm run type-check`
   - Run linting: `npm run lint`

2. **Environment Variables Not Working**
   - Ensure variables start with `VITE_` prefix
   - Redeploy after adding environment variables
   - Check variable names match exactly

3. **Supabase Connection Issues**
   - Verify your Supabase project is active
   - Check that RLS (Row Level Security) policies are configured
   - Ensure your Supabase project allows the Vercel domain

### Pre-deployment Checklist

- [ ] All dependencies installed (`npm install`)
- [ ] Build passes locally (`npm run build`)
- [ ] TypeScript compilation successful (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Environment variables configured
- [ ] Supabase project is active and accessible
- [ ] Code pushed to GitHub repository

## 🔄 Continuous Deployment

Once connected to Vercel:

- Every push to your main branch will trigger automatic deployment
- Preview deployments are created for pull requests
- You can manage deployments from the Vercel dashboard

## 📊 Performance Optimization

The project is already optimized for Vercel with:

- ✅ Vite build configuration
- ✅ Code splitting with manual chunks
- ✅ Terser minification
- ✅ Source maps for debugging
- ✅ ✅ Static file optimization

## 🚀 Post-Deployment

After successful deployment:

1. Test all functionality on the live site
2. Verify Supabase connection works
3. Check admin panel access
4. Test responsive design on mobile devices
5. Verify all images and assets load correctly

## 📱 Domain Configuration (Optional)

To use a custom domain:

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Configure DNS settings as instructed

## 🔒 Security Considerations

- Environment variables are secure in Vercel
- Supabase RLS policies protect your data
- HTTPS is automatically enabled
- No sensitive data in client-side code

---

**Need Help?**

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Supabase Documentation](https://supabase.com/docs)
