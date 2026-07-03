# Domain Deployment Guide

This guide explains how to deploy your Belief Craft Nexus application and connect it to a custom domain.

## Prerequisites

- A domain name (purchased from a registrar like Namecheap, GoDaddy, Google Domains, etc.)
- A GitHub account (for connecting to deployment services)
- Your Supabase project URL and keys
- **PWA Requirements**: This app is a Progressive Web App (PWA) with Add to Home Screen (A2HS) functionality
  - ✅ HTTPS is **required** for PWA (all modern platforms provide this automatically)
  - ✅ Manifest.json is already configured
  - ✅ PWA icons should be in place (`icon-196.png` and `icon-512.png` in `public/` folder)

## Option 1: Deploy to Vercel (Recommended - Easiest)

Vercel is the easiest option for Vite + React apps with automatic deployments.

### Step 1: Prepare Your Code

1. **Ensure your code is on GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Create a `.env.production` file** (optional, you can also set these in Vercel)
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

### Step 2: Deploy to Vercel

1. **Sign up/Login to Vercel**
   - Go to https://vercel.com
   - Sign up with your GitHub account

2. **Import Your Project**
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite settings

3. **Configure Build Settings**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add:
     - `VITE_SUPABASE_URL` = Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon/public key
   - Make sure to add them for "Production", "Preview", and "Development"

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - You'll get a URL like: `your-app.vercel.app`

### Step 3: Connect Your Custom Domain

1. **Add Domain in Vercel**
   - Go to your project → Settings → Domains
   - Enter your domain (e.g., `yourdomain.com` or `www.yourdomain.com`)
   - Click "Add"

2. **Configure DNS Records**
   Vercel will show you the DNS records to add. You need to add these at your domain registrar:

   **For root domain (yourdomain.com):**
   - Type: `A`
   - Name: `@` (or leave blank)
   - Value: `76.76.21.21` (Vercel's IP - check Vercel dashboard for current IP)

   **OR use CNAME (easier):**
   - Type: `CNAME`
   - Name: `@` (or leave blank)
   - Value: `cname.vercel-dns.com`

   **For www subdomain (www.yourdomain.com):**
   - Type: `CNAME`
   - Name: `www`
   - Value: `cname.vercel-dns.com`

3. **Wait for DNS Propagation**
   - DNS changes can take 24-48 hours, but usually work within minutes
   - Check status in Vercel dashboard
   - Use https://dnschecker.org to verify DNS propagation

4. **SSL Certificate**
   - Vercel automatically provisions SSL certificates via Let's Encrypt
   - HTTPS will be enabled automatically once DNS is configured
   - **⚠️ PWA Requirement**: HTTPS is mandatory for PWA functionality and A2HS (Add to Home Screen)

### Step 4: Update Supabase Settings

1. **Add Allowed URLs in Supabase**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your production domain:
     - `https://yourdomain.com`
     - `https://www.yourdomain.com`
   - Add your Vercel preview URL: `https://your-app.vercel.app`

2. **Update Redirect URLs**
   - In Supabase → Authentication → URL Configuration
   - Add redirect URLs:
     - `https://yourdomain.com/auth/callback`
     - `https://www.yourdomain.com/auth/callback`

## Option 2: Deploy to Netlify

### Step 1: Deploy to Netlify

1. **Sign up/Login to Netlify**
   - Go to https://netlify.com
   - Sign up with GitHub

2. **Import Your Project**
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository

3. **Configure Build Settings**
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

4. **Add Environment Variables**
   - Site settings → Environment variables
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

5. **Deploy**
   - Click "Deploy site"
   - You'll get a URL like: `your-app.netlify.app`

### Step 2: Connect Custom Domain

1. **Add Domain**
   - Site settings → Domain management → Add custom domain
   - Enter your domain

2. **Configure DNS**
   - Netlify will show you DNS records to add
   - Add the A or CNAME record at your domain registrar

3. **SSL**
   - Netlify automatically provisions SSL certificates

## Option 3: Deploy to Cloudflare Pages

### Step 1: Deploy to Cloudflare Pages

1. **Sign up/Login to Cloudflare**
   - Go to https://pages.cloudflare.com
   - Sign up with GitHub

2. **Create a Project**
   - Connect your GitHub repository
   - Build settings:
     - Framework preset: Vite
     - Build command: `npm run build`
     - Build output directory: `dist`

3. **Add Environment Variables**
   - Settings → Environment variables
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Step 2: Connect Custom Domain

1. **Add Custom Domain**
   - Go to your project → Custom domains
   - Add your domain

2. **Configure DNS**
   - If your domain is on Cloudflare, DNS is automatic
   - If not, add the CNAME record shown in Cloudflare

## Post-Deployment Checklist

### 1. Test Your Application
- [ ] Visit your domain and verify it loads
- [ ] Test authentication (login/signup)
- [ ] Test all major features
- [ ] Check mobile responsiveness
- [ ] Verify HTTPS is working
- [ ] **PWA: Test manifest.json is accessible** at `https://yourdomain.com/manifest.json`
- [ ] **PWA: Verify icons load** (`/icon-196.png` and `/icon-512.png`)
- [ ] **PWA: Test Add to Home Screen** on mobile device
  - Open site on mobile browser
  - Look for install prompt or browser menu → "Add to Home Screen"
  - Verify app installs and opens in standalone mode
- [ ] **PWA: Test standalone mode** (app should open without browser UI)

### 2. Update Supabase Settings
- [ ] Added production domain to allowed URLs
- [ ] Added redirect URLs for auth callbacks
- [ ] Verified RLS policies work correctly
- [ ] Test database operations

### 3. Environment Variables
- [ ] All `VITE_*` variables are set in deployment platform
- [ ] Supabase Edge Functions have their secrets configured
- [ ] Stripe keys are configured (if using payments)

### 4. Performance
- [ ] Enable compression (usually automatic)
- [ ] Check build size and optimize if needed
- [ ] Test loading times

### 5. Monitoring
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Monitor deployment platform logs
- [ ] Set up uptime monitoring

## Troubleshooting

### Domain Not Resolving
- Wait 24-48 hours for DNS propagation
- Check DNS records are correct using `dig` or online DNS checker
- Verify DNS records match what your hosting provider requires

### SSL Certificate Issues
- Most platforms auto-provision SSL (Vercel, Netlify, Cloudflare)
- Wait for DNS to fully propagate before SSL can be issued
- Check SSL status in your hosting dashboard

### Build Failures
- Check build logs in deployment platform
- Ensure all environment variables are set
- Verify `package.json` has correct build script
- Check for TypeScript errors: `npm run build` locally first

### Authentication Not Working
- Verify Supabase allowed URLs include your domain
- Check redirect URLs are correct
- Verify environment variables are set correctly
- Check browser console for errors

### CORS Issues
- Update Supabase CORS settings if needed
- Check Supabase project settings → API → CORS

### PWA Not Working / A2HS Not Showing
- **HTTPS Required**: PWAs only work over HTTPS. Verify your site uses `https://` not `http://`
- **Manifest Accessible**: Check that `https://yourdomain.com/manifest.json` loads correctly
- **Icons Present**: Verify `/icon-196.png` and `/icon-512.png` exist and are accessible
- **Mobile Testing**: A2HS prompts only appear on mobile devices, not desktop
- **Browser Support**: 
  - Chrome/Edge on Android: Full PWA support
  - Safari on iOS: Limited PWA support (iOS 11.3+)
  - Desktop browsers: Install prompts are intentionally blocked in your code
- **Clear Cache**: If PWA was previously installed, uninstall and reinstall
- **Check Console**: Look for manifest parsing errors in browser DevTools
- **Service Workers**: Your app blocks service workers on desktop (intentional), but they're not required for basic PWA functionality

## Quick Reference: DNS Records

**Vercel:**
```
A Record: @ → 76.76.21.21
CNAME: www → cname.vercel-dns.com
```

**Netlify:**
```
A Record: @ → 75.2.60.5
CNAME: www → your-site.netlify.app
```

**Cloudflare Pages:**
```
CNAME: @ → your-project.pages.dev
CNAME: www → your-project.pages.dev
```

## PWA-Specific Deployment Notes

### Important PWA Requirements

1. **HTTPS is Mandatory**
   - PWAs **must** be served over HTTPS (not HTTP)
   - All modern deployment platforms (Vercel, Netlify, Cloudflare) provide HTTPS automatically
   - Self-signed certificates won't work for PWA

2. **Manifest.json**
   - Located at `public/manifest.json`
   - Must be accessible at `https://yourdomain.com/manifest.json`
   - Already configured with:
     - `start_url: "/"` - App starts at root
     - `display: "standalone"` - Opens without browser UI
     - Icons: `icon-196.png` and `icon-512.png`

3. **PWA Icons**
   - Ensure these files exist in `public/`:
     - `icon-196.png` (196x196 pixels)
     - `icon-512.png` (512x512 pixels)
   - Icons are referenced in `manifest.json` and must be accessible

4. **Add to Home Screen (A2HS)**
   - Works on mobile devices (Android Chrome/Edge, iOS Safari)
   - Desktop install prompts are intentionally blocked in your code
   - Users can manually add via browser menu on mobile
   - Install button is available in Settings page (mobile only)

5. **Testing PWA**
   - **Mobile**: Open site on phone, look for install prompt or use browser menu
   - **Desktop**: Install prompts are blocked (by design)
   - **Lighthouse**: Run PWA audit in Chrome DevTools
   - **Manifest Validator**: Use https://manifest-validator.appspot.com/

### PWA Build Verification

Before deploying, verify locally:
```bash
npm run build
npm run preview
# Visit http://localhost:4173/manifest.json (should load)
# Check that icons are in dist/ folder
```

## Next Steps

1. Set up a staging environment (use a different branch or subdomain)
2. Configure CI/CD for automatic deployments
3. Set up monitoring and error tracking
4. Configure CDN for better performance
5. Set up backup and disaster recovery
6. **PWA**: Test A2HS on multiple devices and browsers
7. **PWA**: Submit to app stores (optional - using PWABuilder or similar)

## Support

- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com
- Cloudflare Pages: https://developers.cloudflare.com/pages
- Supabase Docs: https://supabase.com/docs

