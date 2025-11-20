# Carzo - Vehicle Marketplace Platform

**Domain:** carzo.net
**Business Model:** High-conversion vehicle marketplace for paid traffic
**Revenue:** $0.80 per UNIQUE dealer click per user per 30 days

## Quick Overview

Carzo earns revenue by driving paid traffic (Facebook Ads, Google Display) to conversion-optimized VDP bridge pages that lead to dealership websites. Built with Next.js 16, Supabase, and Tailwind CSS.

**Key Constraint:** Only paid ONCE per dealer per user per 30 days. This means dealer diversification is CRITICAL for revenue optimization.

## Git Workflow Enforcement

**CRITICAL RULES (ALWAYS ENFORCED):**

1. **NEVER work on main branch directly**
   - **ALL work must happen on a feature/fix/docs branch**
   - Only exception: User explicitly says "work on main"
   - Create branch BEFORE making any changes
   - Check current branch with `git branch --show-current`

2. **NEVER merge PRs without explicit user approval**
   - Create PR and wait for user's "merge" command
   - User reviews PR first (human + AI bots: gemini-code-assist, claude)
   - **DO NOT auto-merge even if approved by bots**

3. **ALWAYS respond to PR feedback with comments**
   - When addressing feedback from gemini-code-assist or claude (AI reviewers)
   - Add PR comment tagging the bot: `@gemini-code-assist` or `@claude`
   - Describe what was changed and why
   - Example: `@gemini-code-assist Fixed the type safety issue by adding explicit types to the function parameters as suggested.`
   - If feedback NOT addressed, explain why: `@claude I did not implement X because...`

4. **NEVER force push to main**
   - `git push --force origin main` is FORBIDDEN
   - Use force push only on feature branches if needed

5. **Use GitHub CLI for all GitHub operations**
   - Create PRs: `gh pr create --fill` (automatically uses commit messages)
   - Comment on PRs: `gh pr comment PR_NUMBER --body "..."`
   - View PRs: `gh pr view PR_NUMBER`
   - List PRs: `gh pr list`
   - Merge PRs: `gh pr merge PR_NUMBER --squash` (only after explicit user approval; confirm strategy with user)
   - **DO NOT ask user to perform GitHub operations manually** when `gh` CLI can do it

6.  **Pre-PR Documentation & QA Protocol**
   - **Documentation**: Always check if docs (Reference, How-To, etc.) need updates *before* PR creation.
   - **Iterative QA**: Run comprehensive QA -> Fix bugs -> Rerun QA. **Do not** create a PR with known bugs hoping for a review to catch them.

7.  **Use Vercel CLI for all Vercel operations**
   - Whenever possible, leverage `vercel` CLI commands instead of manual dashboard actions.
   - Deploy: `vercel deploy --prod` (or `--force` if needed)
   - Check deployments: `vercel list`
   - View logs: `vercel logs`
   - Manage environment variables: `vercel env pull`, `vercel env push`, `vercel env ls`, `vercel env add`
   - **DO NOT ask user to perform Vercel dashboard actions manually** when `vercel` CLI can do it.

## Tech Stack

### Core Framework
- **Next.js 16** - App Router with Server Components
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Turbopack** - Default bundler (2-5x faster than Webpack)

### Database & Backend
- **Supabase** - PostgreSQL database with PostGIS extension
- **PostGIS** - Spatial queries for location-based vehicle search (100x faster than client-side)
- **Node.js** - Runtime for API routes and server components

### Styling & UI
- **Tailwind CSS v4** - CSS-first configuration with custom design system
- **Radix UI** - Accessible UI primitives (Slot pattern for component composition)
- **Sharp** - Image optimization and blur generation

### External Services
- **MaxMind GeoIP2** - IP-based location detection for radius filtering
- **LotLinx Publisher Feed** - Vehicle inventory source (72K+ vehicles, 4x daily updates)

### Deployment & Infrastructure
- **Vercel** - Hosting and deployment platform
- **Vercel Cron** - Scheduled feed syncs (4x daily at 03:00, 09:00, 15:00, 21:00 UTC)

### User Tracking
- **Cookie-based tracking** - No JWT or authentication (anonymous users only)
- **Session Storage** - Per-tab session tracking

## Critical Commands

```bash
# Development
npm run dev              # Start dev server (Turbopack, port 3000)
npm run build            # Production build
npm run start            # Start production server
npm run type-check       # TypeScript validation (if configured)

# Database (Supabase CLI)
supabase start           # Start local Supabase (Docker)
supabase db push         # Apply migrations to remote
supabase db pull         # Pull schema from remote
supabase db reset        # Reset local database
supabase db execute      # Run ad-hoc SQL queries

# Testing
npm run test             # Run Vitest unit tests
npm run test:watch       # Watch mode for tests

# Feed Sync
npx tsx scripts/sync-feed.ts    # Manual feed sync (all 72K vehicles)
./scripts/test-cron.sh          # Test cron endpoint locally
```

## Project Structure

```
carzo/
├── app/                 # Next.js 16 App Router
│   ├── page.tsx         # Homepage with hero search
│   ├── search/          # Search results page
│   ├── vehicles/[vin]/  # VDP bridge page (THE MONEY PAGE)
│   └── api/             # API route handlers
│       ├── search-vehicles/     # PostGIS spatial queries
│       ├── track-click/         # Click deduplication
│       ├── detect-location/     # MaxMind integration
│       └── cron/sync-feed/      # LotLinx feed sync
│
├── components/          # React components
│   ├── ui/              # Reusable UI component library
│   │   ├── Button.tsx   # 6 variants (primary, brand, etc.)
│   │   ├── Input.tsx    # Input with error states
│   │   ├── Badge.tsx    # 7 variants
│   │   └── Card.tsx     # Compound components
│   ├── Search/          # Search-related components
│   ├── VDP/             # VDP bridge page components
│   └── Home/            # Homepage components
│
├── lib/                 # Business logic & utilities
│   ├── supabase.ts      # Supabase client + types
│   ├── user-tracking.ts # Cookie-based user tracking
│   ├── dealer-diversity.ts  # Revenue optimization algorithm
│   ├── feed-sync.ts     # LotLinx feed integration
│   ├── geolocation.ts   # MaxMind GeoIP + Haversine
│   ├── revenue.ts       # Revenue calculation
│   ├── flow-detection.ts    # A/B test flow routing
│   └── utils.ts         # Utility functions (cn() for class merging)
│
├── supabase/
│   └── migrations/      # Database schema migrations (14 files)
│
├── scripts/
│   ├── sync-feed.ts     # Manual feed sync
│   └── test-cron.sh     # Test cron endpoint
│
├── docs/                # Documentation (Diátaxis framework)
│   ├── tutorials/       # Learning-oriented guides
│   ├── how-to/          # Problem-solving recipes
│   ├── reference/       # Technical specifications
│   └── explanation/     # Conceptual understanding
│
├── AGENTS.md            # This file (LLM-agnostic context)
├── CLAUDE.md            # Claude Code-specific instructions
├── README.md            # Human-readable overview
└── supabase-schema.sql  # Complete database schema
```

## Business Rules (CRITICAL)

### Revenue Model Constraint
- **$0.80 per UNIQUE dealer click per user per 30 days**
- **Problem:** Multiple clicks to same dealer = paid ONCE
- **Solution:** Dealer diversification algorithm applied to ALL vehicle lists
- **Implementation:** `lib/dealer-diversity.ts` (round-robin algorithm)
- **Target:** >80% dealer diversity score

### Dealer Diversification Requirements
Apply to:
- Search results (max 1-2 vehicles per dealer per page)
- Featured vehicles on homepage
- Related vehicles on VDP
- ANY list showing multiple vehicles

**Critical:** `dealer_id` tracking is ESSENTIAL for all dealer clicks

### Click Tracking & Deduplication
- Track every click with `dealer_id`, `user_id`, `vehicle_id`
- Check `dealer_click_history` table for 30-day window
- Mark `is_billable` appropriately (first click = true, subsequent = false)
- Update `dealer_click_history` table
- Return billable status to frontend (for UI feedback)

### VDP Bridge Page Strategy
"Confirm, Tempt, Convert" approach:
- Verified listing badge (trust)
- Photo gallery tease (blurred thumbnails + "+X More")
- Primary CTA: "See Full Photo Gallery" (opens dealer site in new tab)
- Secondary CTAs: "View FREE Vehicle History", "Estimate Monthly Payments"
- ALL CTAs go to same dealer URL, open in new tab

### All Dealer Links Behavior
- `target="_blank" rel="noopener noreferrer"`
- Keep user on our site for more browsing
- Maximizes unique dealer clicks per session

## Code Conventions

### TypeScript
- Strict mode enabled
- All functions have explicit return types
- Props interfaces for all components
- No `any` types (use `unknown` if needed)

### React Patterns
- **Server Components by default** (Next.js 16 App Router)
- Client Components only when necessary (`'use client'`)
- Use Suspense boundaries for async components
- Extract logic into custom hooks when complex

### Styling
- **Always use semantic color tokens** (never hard-coded colors)
  - `bg-primary`, `text-primary` - Red (#dc2626) for primary CTAs
  - `bg-brand`, `text-brand` - Blue (#2563eb) for brand accents
  - `bg-dealer` - Violet (#7c3aed) for dealer-specific elements
  - `bg-muted`, `text-muted-foreground` - Gray for muted elements
- **Use `cn()` utility** from `lib/utils.ts` for conditional classes
- **Use UI components** from `components/ui` instead of raw HTML
- **Mobile-first** approach (base styles for 320px+, use `lg:` for desktop)
- **Touch targets minimum 40x40px** (WCAG Level AAA)

### Accessibility
- **Use `focus-visible:` instead of `focus:`** for keyboard-only focus rings
- All buttons have accessible labels
- Images have alt text
- Semantic HTML (nav, main, article, etc.)

### Git Workflow
- **Branch naming:** `feature/`, `fix/`, `docs/`, `refactor/`
- **Commit format:** `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- **Never commit to main branch directly**
- **Never force push to main**
- **Create PR for all changes**

## Common Gotchas

### Next.js 16 Specifics
- **Dynamic route params are now async** - Must `await params` in page components
- **Suspense boundaries required** for `useSearchParams()`
- **`middleware.ts` renamed to `proxy.ts`** (Node.js runtime by default)
- **Turbopack is default** for dev (2-5x faster)

### PostGIS Spatial Queries
- **`location` column is auto-updated** via trigger when lat/lon changes
- **Use GIST spatial index** for fast radius queries (100x faster)
- **Always use `ST_DWithin`** for radius queries (not client-side Haversine)
- **`targeting_radius` field** specifies search radius per vehicle (default 30 miles)

### Rate Limiting
- **Uses PostgreSQL unlogged tables** (not Redis)
- **Advisory locks prevent race conditions**
- **Automatic cleanup of old records**
- **All POST endpoints must call `checkMultipleRateLimits()`**
- **Include rate limit headers** in responses (`X-RateLimit-*`)

### Supabase Migrations
- **Use Supabase CLI for ALL database work** (not manual dashboard SQL)
- **Reserved words** (like `interval`) need quotes or prefixes
- **Type casting** required for certain column types (GEOGRAPHY, JSONB)
- **Always test locally** with `supabase start` before pushing

### Feed Sync
- **LotLinx feed updates 4x daily** (03:00, 09:00, 15:00, 21:00 UTC)
- **Vercel cron automatically adds auth header** (`CRON_SECRET`)
- **Vehicles removed from feed** when advertiser budget depletes
- **No separate budget tracking** needed on our side

## Architecture References

For detailed architecture explanations, see `/docs/explanation/`:
- `architecture-overview.md` - System design with Mermaid diagrams
- `business-model.md` - Revenue calculation, constraints
- `dealer-diversification.md` - Algorithm explanation with visuals
- `rate-limiting-strategy.md` - Why PostgreSQL over Redis
- `postgis-spatial-queries.md` - Performance optimization
- `nextjs-16-decisions.md` - Framework choices
- `cookie-tracking.md` - Why cookies, not JWT
- `ab-testing-flows.md` - Flow A/B/C decision tree

For API reference, see `/docs/reference/api/`:
- `search-vehicles.md` - PostGIS spatial query endpoint
- `track-click.md` - Deduplication logic
- `detect-location.md` - MaxMind integration
- (7 more endpoints documented)

For how-to guides, see `/docs/how-to/`:
- `add-api-endpoint.md` - Complete pattern with rate limiting
- `create-migration.md` - Supabase CLI workflow
- `troubleshooting.md` - Common errors and solutions
- (5 more guides)

For tutorials, see `/docs/tutorials/`:
- `getting-started.md` - Complete onboarding (< 30 min setup)
- `your-first-migration.md` - Hands-on Supabase CLI walkthrough
- (2 more tutorials)

## Performance Targets

- **Homepage LCP:** < 1.5s
- **Search results response:** < 1s
- **VDP LCP:** < 2s
- **Database queries:** < 100ms p95
- **PostGIS spatial queries:** ~50-100ms (vs. 3-5s client-side)

## Security Considerations

- **Never commit secrets** - Use `.env.local` (gitignored)
- **All API endpoints need rate limiting** - Check `lib/rate-limit.ts` patterns
- **Check for SQL injection** - Use parameterized queries
- **Check for XSS** - Sanitize user inputs
- **RLS policies** on Supabase tables for data security

## Environment Variables

See `.env.example` for complete list. Key variables:

```bash
# Supabase (from dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# LotLinx Feed
LOTLINX_FEED_USERNAME=your_username
LOTLINX_FEED_PASSWORD=your_password
LOTLINX_PUBLISHER_ID=your_publisher_id

# Vercel Cron
CRON_SECRET=your_cron_secret

# MaxMind GeoIP2
MAXMIND_ACCOUNT_ID=your_account_id
MAXMIND_LICENSE_KEY=your_license_key

# Domain
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Production: https://carzo.net

# Admin Dashboard
ADMIN_PASSWORD=your_admin_password
```

## Key Files to Reference

When working on specific areas, reference these files:

### Revenue Optimization
- `lib/dealer-diversity.ts` - Round-robin algorithm (DO NOT MODIFY without approval)
- `app/api/track-click/route.ts` - Click deduplication logic

### Location-Based Search
- `lib/geolocation.ts` - MaxMind GeoIP + Haversine formulas
- `app/api/search-vehicles/route.ts` - PostGIS spatial queries
- `supabase/migrations/20251111000002_add_location_columns.sql` - PostGIS setup

### UI Components
- `components/ui/Button.tsx` - Component library pattern (forwardRef, Slot, cn())
- `app/globals.css` - Tailwind v4 design system (@theme directive)

### Feed Sync
- `lib/feed-sync.ts` - LotLinx integration logic
- `app/api/cron/sync-feed/route.ts` - Cron endpoint (4x daily)
- `vercel.json` - Cron schedule configuration

## Project Status

**All Core Features Complete:**
- ✅ Next.js 16 project with Turbopack
- ✅ Supabase with 72,051 vehicles loaded
- ✅ User tracking system (cookie-based)
- ✅ Dealer diversification algorithm
- ✅ VDP bridge page (conversion-optimized)
- ✅ Click tracking with 30-day deduplication
- ✅ Search results with PostGIS spatial queries
- ✅ Homepage with hero search
- ✅ Analytics dashboard
- ✅ Feed sync (4x daily cron)
- ✅ IP geolocation (MaxMind)
- ✅ Rate limiting (PostgreSQL-based)
- ✅ A/B test flow routing (3 variants)
- ✅ Tailwind CSS v4 design system
- ✅ UI component library
- ✅ Mobile optimization

**Ready for deployment to Vercel**

---

**Last Updated:** 2025-11-12
**For LLM-specific instructions, see:**
- `CLAUDE.md` - Claude Code-specific tool usage and preferences
- `.cursorrules` - Cursor-specific (if using Cursor)
- `.github/copilot-instructions.md` - GitHub Copilot (if using)
