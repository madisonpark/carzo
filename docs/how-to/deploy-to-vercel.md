# How to Deploy to Vercel

## 1. Overview
This document outlines the strategy and detailed steps for deploying the Carzo application from a local development environment to Vercel production. It covers environment setup, database synchronization, and verification steps.

## 2. Deployment Prerequisites
- **Vercel Account:** Access to the Vercel team/project.
- **Supabase Project:** Production instance ready (distinct from local dev).
- **Environment Variables:** All secrets from `.env.local` ready for Vercel.
- **Domain Access:** DNS control for `carzo.net`.

## 3. Architecture & Infrastructure
*   **Frontend/API:** Next.js on Vercel (Serverless Functions).
*   **Database:** Supabase (PostgreSQL + PostGIS).
*   **Cron Jobs:** Vercel Cron (Feed Sync, Maintenance).
*   **Assets:** LotLinx CDN (Remote Images).

---

## Step 1: Initial Vercel Setup

### Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel auto-detects Next.js framework

### Build Settings

**Framework Preset:** Next.js (auto-detected)

**Root Directory:** `./` (leave default)

**Build Command:**
```bash
npm run build
```

**Output Directory:** `.next` (auto-detected)

**Install Command:**
```bash
npm install
```

---

## Step 2: Environment Variables

### Required Variables

Add all environment variables before first deployment:

1. Go to **Settings** → **Environment Variables**
2. Add each variable with values from your local `.env.local` file.
3. Select environments: **Production**, **Preview**, **Development**

**List of required variables (see `.env.example` for full list):**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... # CRITICAL: For cron jobs and admin functions

# LotLinx Feed
LOTLINX_FEED_USERNAME=your_username
LOTLINX_FEED_PASSWORD=your_password
LOTLINX_PUBLISHER_ID=12345

# Vercel Cron
CRON_SECRET=your_random_secret_here # Generate with: openssl rand -base64 32

# Domain
NEXT_PUBLIC_SITE_URL=https://carzo.net

# Admin
ADMIN_PASSWORD=your_admin_password

# MaxMind GeoIP2 (for IP-based location detection)
MAXMIND_ACCOUNT_ID=your_maxmind_account_id
MAXMIND_LICENSE_KEY=your_maxmind_license_key

# Error Monitoring (Sentry)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here

# Facebook Pixel
NEXT_PUBLIC_FB_PIXEL_ID=your_facebook_pixel_id_here
```

### Generate CRON_SECRET

```bash
# Generate secure random string
openssl rand -base64 32
```

---

## Step 3: Deploy

### Initial Deployment

1. Click **"Deploy"** button
2. Vercel builds and deploys automatically
3. Wait ~2-3 minutes for build
4. Check deployment logs for errors

### Deployment URL

Initial deployment gets URL:
```
https://carzo-your-project.vercel.app
```

---

## Step 4: Configure Custom Domain

### Add Domain

1. Go to **Settings** → **Domains**
2. Click **"Add"**
3. Enter your domain: `carzo.net`
4. Click **"Add"**

### DNS Configuration

Add these records to your domain registrar (e.g., Namecheap, GoDaddy):

**For root domain (carzo.net):**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

### SSL Certificate

- Vercel automatically provisions SSL certificate (Let's Encrypt)
- Takes 1-5 minutes after DNS propagates
- HTTPS enabled by default

---

## Step 5: Verify Cron Jobs

### Check Cron Configuration

Vercel auto-registers cron jobs from `vercel.json`. Refer to `vercel.json` for the current cron job configuration and schedules.


### Test Cron Endpoints

```bash
# Test feed sync
curl "https://carzo.net/api/cron/sync-feed" \
  -H "Authorization: Bearer your_cron_secret"

# Test rate limit cleanup
curl "https://carzo.net/api/cron/cleanup-rate-limits" \
  -H "Authorization: Bearer your_cron_secret"
```

### Monitor Cron Logs

1. Go to **Deployments** → Latest deployment
2. Click **"Functions"** tab
3. Filter by `/api/cron/sync-feed`
4. Check execution logs

---

## Step 6: Database Migration

### Apply Migrations to Production

1.  **Link to production Supabase project:**
    ```bash
    supabase link --project-ref your-prod-project-ref
    ```
2.  **Check migration status:**
    ```bash
    supabase migration list
    ```
3.  **Apply all pending migrations safely:**
    ```bash
    supabase migration up --linked
    ```
    *Note:* Avoid `supabase db push` in production as it bypasses migration version control and `supabase db reset` is destructive and should **NEVER** be used on production.

### Verify Schema

```bash
# Verify tables exist
supabase db execute --sql "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
# Verify specific new columns exist (e.g., from attribution plan)
supabase db execute --sql "SELECT column_name FROM information_schema.columns WHERE table_name='clicks' AND column_name IN ('user_agent', 'ip_address', 'fbclid', 'gclid', 'ttclid', 'tblci', 'utm_term', 'utm_content');"
```

---

## Step 7: Smoke Test

### Test Key Features

1. **Homepage:** https://carzo.net
   - Hero search works
   - Featured vehicles load

2. **Search:** https://carzo.net/search?make=Toyota
   - Results load
   - Filters work
   - Pagination works

3. **VDP:** https://carzo.net/vehicles/{vin}
   - Vehicle details load
   - CTAs open dealer URL in new tab
   - Click tracking works

4. **Admin:** https://carzo.net/admin
   - Login works
   - Analytics load

### Test Click Tracking

Open browser DevTools → Network tab:

1. Click "See Full Photo Gallery" on VDP
2. Verify POST to `/api/track-click` returns 200
3. Check `is_billable` flag in response

---

## Step 8: Monitor Performance

### Vercel Analytics

Enable Analytics (optional, paid):

1. Go to **Analytics** tab
2. Click **"Enable"**
3. Monitor:
   - Page load times
   - Core Web Vitals
   - Geographic distribution

### Check Logs

1. Go to **Logs** tab
2. Filter by time range
3. Check for errors:
   - 500 Internal Server Error
   - Failed cron jobs
   - Database connection errors

---

## Troubleshooting

### Build Fails

**Error:** `Module not found`

**Fix:**
```bash
# Delete node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Test build locally
npm run build
```

### Environment Variables Not Loading

**Error:** `NEXT_PUBLIC_SUPABASE_URL is undefined`

**Fix:**
1. Go to **Settings** → **Environment Variables**
2. Verify variable exists
3. Check selected environments (Production, Preview, Development)
4. Redeploy to apply changes

### Cron Jobs Not Running

**Error:** Cron endpoint returns 401

**Fix:**
1. Verify `CRON_SECRET` set in environment variables
2. Check `vercel.json` cron configuration
3. Redeploy to register cron jobs
4. Wait 5 minutes for Vercel to recognize cron config

### Domain Not Resolving

**Error:** `DNS_PROBE_FINISHED_NXDOMAIN`

**Fix:**
1. Check DNS records at registrar
2. Wait 24-48 hours for DNS propagation
3. Use `dig carzo.net` to verify records
4. Try incognito mode (clear DNS cache)

### Database Connection Errors

**Error:** `Failed to connect to Supabase`

**Fix:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` correct
2. Check `SUPABASE_SERVICE_ROLE_KEY` correct
3. Test connection with curl:
```bash
curl "https://your-project.supabase.co/rest/v1/vehicles?limit=1" \
  -H "apikey: your_anon_key"
```

---

## Post-Deployment Checklist

- [ ] All environment variables set
- [ ] Custom domain configured and SSL active
- [ ] Cron jobs registered and tested
- [ ] Database migrations applied
- [ ] Smoke tests passed (homepage, search, VDP, admin)
- [ ] Click tracking verified
- [ ] Logs checked for errors
- [ ] Performance monitoring enabled
- [ ] Team notified of deployment

---

## Continuous Deployment

### Auto-Deploy on Push

Vercel automatically deploys when you push to GitHub:

**Main branch** → Production deployment (carzo.net)
**Other branches** → Preview deployment (unique URL)

### Preview Deployments

Every pull request gets preview URL:
```
https://carzo-git-feature-branch.vercel.app
```

**Preview URL posted as PR comment automatically.**

---

## Rollback

### Revert to Previous Deployment

1. Go to **Deployments** tab
2. Find previous successful deployment
3. Click **"⋯"** menu → **"Promote to Production"**
4. Confirm rollback

**Rollback takes ~30 seconds.**

---

## Solo Founder Optimizations
As a one-person startup, speed and simplicity are key. Consider these adjustments:
*   **Vercel Toolbar:** Use it in production for instant feedback on layout shifts and errors without complex monitoring tools.
*   **Cost Control:** Stay on the Hobby plan until you hit limits. The current architecture (ISR + cached feed) is highly efficient.
*   **Manual Backups:** Before running `supabase migration up --linked` on production, simply use the Supabase Dashboard to create a manual backup. It's faster than writing complex rollback scripts.
*   **Log Monitoring:** Don't over-engineer alerting yet. Just check Vercel Logs once a day to ensure cron jobs ran.

---

## Related Documentation

- [Environment Variables](../reference/environment-variables.md)
- [Vercel Configuration](../reference/vercel-config.md)
- [Create Migration](./create-migration.md)
- [Deployment Strategy](../explanation/deployment-strategy.md) - High-level overview and strategic decisions.
- [Logging & Attribution Strategy](../explanation/logging-attribution-strategy.md) - Details on error tracking and marketing attribution.
- [Vercel Docs](https://vercel.com/docs)

**Last Updated**: 2025-11-20

