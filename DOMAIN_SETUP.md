# 🌐 Custom Domain Setup Guide for PIKO Café Digital Menu

## Quick Setup Options

### Option 1: Vercel Dashboard (Recommended) ⭐

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in to your account
   - Navigate to your **PIKO Café Digital Menu** project

2. **Add Domain**
   - Click **"Settings"** tab
   - Select **"Domains"** from sidebar
   - Click **"Add Domain"**
   - Enter your domain: `your-domain.com` or `menu.your-domain.com`

3. **Configure DNS** (Choose one method)

#### Method A: Vercel Nameservers (Easiest)
```
Nameservers to set at your domain registrar:
- ns1.vercel-dns.com
- ns2.vercel-dns.com
```

#### Method B: DNS Records (Keep current DNS)
```
A Record: @ → 76.76.19.61
CNAME: www → cname.vercel-dns.com
```

### Option 2: Vercel CLI

```bash
# Login to Vercel
vercel login

# Add domain to your project
vercel domains add your-domain.com piko-cafe-digital-menu

# Check domain status
vercel domains inspect your-domain.com
```

## 🔧 DNS Configuration Details

### For Root Domain (your-domain.com)

**Option A: A Record**
```
Type: A
Name: @
Value: 76.76.19.61
TTL: 3600
```

**Option B: CNAME Record**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: 3600
```

### For Subdomain (menu.your-domain.com)

```
Type: CNAME
Name: menu
Value: cname.vercel-dns.com
TTL: 3600
```

### For WWW Subdomain

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

## 🛡️ SSL Certificate

**Automatic SSL**: Vercel automatically provides SSL certificates for all domains
- ✅ HTTPS enabled by default
- ✅ Automatic certificate renewal
- ✅ HTTP to HTTPS redirect

## 📋 Domain Setup Checklist

### Before Adding Domain
- [ ] Domain is registered and active
- [ ] You have access to DNS settings
- [ ] Domain is not already in use elsewhere

### After Adding Domain
- [ ] DNS records are configured correctly
- [ ] Wait for DNS propagation (24-48 hours)
- [ ] Test domain accessibility
- [ ] Verify SSL certificate is active
- [ ] Test all functionality on new domain

## 🔍 Verification Steps

1. **Check DNS Propagation**
   ```bash
   # Check if DNS is propagated
   nslookup your-domain.com
   dig your-domain.com
   ```

2. **Test Domain Access**
   - Visit `https://your-domain.com`
   - Check SSL certificate validity
   - Test all menu functionality

3. **Vercel Dashboard Check**
   - Go to project settings → Domains
   - Verify domain shows as "Valid"
   - Check deployment status

## 🚨 Troubleshooting

### Common Issues

**Domain Not Working**
- Check DNS propagation: [whatsmydns.net](https://whatsmydns.net)
- Verify DNS records are correct
- Wait 24-48 hours for full propagation

**SSL Certificate Issues**
- Vercel automatically handles SSL
- If issues persist, contact Vercel support

**Subdomain Not Working**
- Ensure CNAME record is set correctly
- Check that subdomain points to `cname.vercel-dns.com`

### DNS Record Examples by Provider

**GoDaddy**
```
A Record: @ → 76.76.19.61
CNAME: www → cname.vercel-dns.com
```

**Namecheap**
```
A Record: @ → 76.76.19.61
CNAME: www → cname.vercel-dns.com
```

**Cloudflare**
```
A Record: @ → 76.76.19.61
CNAME: www → cname.vercel-dns.com
```

## 🎯 Recommended Domain Names

For your PIKO Café Digital Menu, consider these domain options:

- `piko-cafe.com` (main website)
- `menu.piko-cafe.com` (digital menu)
- `order.piko-cafe.com` (ordering system)
- `piko-menu.com` (dedicated menu domain)

## 📱 Mobile Considerations

- Ensure domain works on mobile devices
- Test responsive design on new domain
- Verify touch interactions work properly

## 🔄 Domain Management

### Changing Domains
1. Add new domain in Vercel dashboard
2. Update DNS records
3. Remove old domain (optional)
4. Update any hardcoded references

### Multiple Domains
- You can add multiple domains to the same project
- All domains will serve the same content
- Useful for different languages or regions

---

## 🆘 Need Help?

- **Vercel Support**: [vercel.com/help](https://vercel.com/help)
- **DNS Issues**: Contact your domain registrar
- **SSL Problems**: Vercel handles this automatically

**Current Project URL**: https://piko-cafe-pastry-digital-menu.vercel.app/
**Target**: Your custom domain will replace this URL
