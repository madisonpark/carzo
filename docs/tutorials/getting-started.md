# Tutorial: Getting Started with Carzo

Complete onboarding tutorial for new developers. Follow this step-by-step guide to get Carzo running locally in < 30 minutes.

## What You'll Learn

- Clone and set up the Carzo project
- Configure environment variables
- Set up Supabase database
- Run the development server
- Make your first code change

## Prerequisites

- Node.js 20+ installed
- PostgreSQL client (psql) installed
- Git installed
- Text editor (VS Code recommended)
- GitHub account

---

## Step 1: Clone Repository (2 min)

```bash
# Clone the repository
git clone https://github.com/your-org/carzo.git
cd carzo

# Install dependencies
npm install
```

**Expected output:**
```
added 342 packages in 15s
```

---

## Step 2: Environment Setup (5 min)

### Copy Environment Template

```bash
cp .env.example .env.local
```

### Get Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project (or create new one)
3. Go to **Settings** → **API**
4. Copy:
   - Project URL
   - anon public key
   - service_role key

### Fill in `.env.local`

```bash
# Edit .env.local
nano .env.local
```

**Minimum required variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Optional (for full functionality):**
```bash
LOTLINX_FEED_USERNAME=your_username  # From team
LOTLINX_FEED_PASSWORD=your_password  # From team
LOTLINX_PUBLISHER_ID=12345           # From team
MAXMIND_ACCOUNT_ID=123456            # Sign up at maxmind.com
MAXMIND_LICENSE_KEY=your_key         # From MaxMind dashboard
ADMIN_PASSWORD=dev_password          # Any password
CRON_SECRET=dev_cron_secret          # Any random string
```

---

## Step 3: Database Setup (10 min)

### Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Or npm
npm install -g supabase

# Verify
supabase --version
```

### Link to Your Project

```bash
supabase link --project-ref your-project-ref
```

**Find project ref:** Supabase Dashboard → Settings → General → Reference ID

### Apply Migrations

```bash
# Check migration status
supabase migration list

# Push all migrations
supabase db push
```

**Expected output:**
```
Applying migration 20251111000000_initial_schema.sql...
Applying migration 20251111000001_fix_column_sizes.sql...
...
All migrations applied successfully!
```

### Verify Tables Created

```bash
psql $NEXT_PUBLIC_SUPABASE_URL -c "\dt"
```

**Expected tables:**
- vehicles
- clicks
- dealer_click_history
- impressions
- rate_limits
- feed_sync_logs

---

## Step 4: Seed Sample Data (5 min)

### Option A: Quick Seed (100 vehicles)

```bash
npx tsx scripts/test-feed-sync.ts --limit 100
```

### Option B: Full Feed Sync (72K vehicles, ~5 min)

```bash
# Only if you have LotLinx credentials
npx tsx scripts/sync-feed.ts
```

### Verify Data Loaded

```bash
psql $NEXT_PUBLIC_SUPABASE_URL -c "SELECT COUNT(*) FROM vehicles;"
```

**Expected:** 100+ vehicles

---

## Step 5: Start Dev Server (1 min)

```bash
npm run dev
```

**Expected output:**
```
▲ Next.js 16.0.0 (turbo)
- Local:   http://localhost:3000

✓ Ready in 1.2s
```

---

## Step 6: Verify Setup (5 min)

### Test Homepage

Open http://localhost:3000

**You should see:**
- Carzo logo and hero search
- Featured vehicles (if data loaded)
- No errors in console

### Test Search

1. Go to http://localhost:3000/search?make=Toyota
2. Verify vehicles load
3. Try filters (model, price, condition)

### Test VDP (Vehicle Detail Page)

1. Click any vehicle card
2. Verify VDP loads
3. Click "See Full Photo Gallery"
4. Should open dealer URL in new tab
5. Check browser DevTools → Network → POST to `/api/track-click`

### Test Admin Dashboard

1. Go to http://localhost:3000/admin
2. Enter password from `ADMIN_PASSWORD` env var
3. Verify analytics dashboard loads

---

## Step 7: Make Your First Change (5 min)

Let's modify the homepage hero text.

### Edit Homepage

```bash
# Open homepage in editor
code app/page.tsx
```

### Find Hero Section

```tsx
// app/page.tsx (around line 20)
<h1 className="text-5xl font-bold">
  Find Your Perfect Vehicle  {/* Change this! */}
</h1>
```

### Make Change

```tsx
<h1 className="text-5xl font-bold">
  Welcome to Carzo!  {/* Your change */}
</h1>
```

### Save and View

1. Save file (Cmd+S / Ctrl+S)
2. Browser auto-refreshes (Hot Module Replacement)
3. See your change on homepage

**Congratulations!** 🎉 You just made your first code change.

---

## Step 8: Create Your First Branch

```bash
# Create feature branch
git checkout -b feature/my-first-change

# Stage changes
git add app/page.tsx

# Commit
git commit -m "feat: update homepage hero text"

# Push to GitHub
git push -u origin feature/my-first-change
```

---

## Troubleshooting

### "Cannot connect to Supabase"

**Check:**
```bash
# Test connection
curl "https://your-project.supabase.co/rest/v1/vehicles?limit=1" \
  -H "apikey: your_anon_key"
```

**Fix:** Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct.

### "No vehicles found"

**Cause:** Database is empty

**Fix:**
```bash
# Load sample data
npx tsx scripts/test-feed-sync.ts --limit 100
```

### "Module not found"

**Cause:** Dependencies not installed

**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Dev server won't start

**Cause:** Port 3000 already in use

**Fix:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Or use different port
PORT=3001 npm run dev
```

---

## Next Steps

Now that you have Carzo running locally:

1. ✅ Read [Architecture Overview](../explanation/architecture-overview.md)
2. ✅ Try [Your First Migration](./your-first-migration.md) tutorial
3. ✅ Explore [Component Library](../reference/components/overview.md)
4. ✅ Review [How-To Guides](../how-to/) for common tasks

---

## Quick Reference

**Start dev server:**
```bash
npm run dev
```

**Run tests:**
```bash
npm run test
```

**Apply migrations:**
```bash
supabase db push
```

**Sync feed:**
```bash
npx tsx scripts/sync-feed.ts
```

**View logs:**
```bash
# Check Next.js logs in terminal where npm run dev is running
```

---

## Getting Help

- 📖 Read the [docs](../README.md)
- 💬 Ask in team Slack #carzo-dev
- 🐛 Report issues on GitHub
- 📧 Email: dev@carzo.net

---

**Tutorial complete!** You're now ready to start developing on Carzo.
