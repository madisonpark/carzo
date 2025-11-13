# Carzo - Vehicle Marketplace

**Domain:** [carzo.net](https://carzo.net)

A high-conversion vehicle marketplace platform optimized for paid traffic. Built with Next.js 16 and Supabase.

## Business Model

- **Revenue:** $0.80 per UNIQUE DEALER click per user per 30 days
- **Traffic:** Facebook Ads, Google Display Network → VDP Bridge Pages → Dealer Sites
- **Inventory:** 72,000+ vehicles updated 4x daily from LotLinx feed

## Tech Stack

- **Framework:** Next.js 16 (with Turbopack)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **Images:** Sharp (blur generation)
- **Tracking:** Cookie-based anonymous user IDs

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the schema migration:
   - Go to SQL Editor in Supabase dashboard
   - Copy contents of `supabase-schema.sql`
   - Execute the SQL

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your credentials from Supabase dashboard and the lotlinx project.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Key Features

### Dealer Diversification (Revenue Optimization)
Automatically rotates dealers in search results to maximize billable clicks. Business rule: $0.80 per unique dealer per user per 30 days.

### Click Tracking with Deduplication
Tracks which dealers each user has clicked in a 30-day window. Only first click to each dealer is billable.

### VDP Bridge Page (Conversion Optimized)
"Confirm, Tempt, Convert" strategy with verified listing badge, blurred photo tease, and multiple CTAs. All links open in new tab.

### Anonymous User Tracking
Simple cookie-based approach (no JWT needed). Persistent UUID stored for 1 year.

## Project Status

**All Core Features Complete:**
- ✅ Next.js 16 with Turbopack (2-5x faster builds)
- ✅ Supabase with 72,051 vehicles loaded
- ✅ User tracking system (cookie-based, 1 year expiration)
- ✅ Dealer diversification algorithm (97.61% test coverage)
- ✅ VDP bridge page (conversion-optimized, 40%+ CTR target)
- ✅ Click tracking API with 30-day deduplication
- ✅ Search results with PostGIS spatial queries (100x faster)
- ✅ Homepage with hero search and featured vehicles
- ✅ Analytics dashboard with billable/non-billable breakdown
- ✅ Feed sync (LotLinx) with 4x daily cron schedule
- ✅ IP geolocation (MaxMind) with localhost fallback
- ✅ Rate limiting (PostgreSQL-based, no Redis)
- ✅ A/B test flow routing (3 variants)
- ✅ Tailwind CSS v4 design system
- ✅ UI component library (Button, Input, Badge, Card)
- ✅ Mobile optimization (filter drawer, touch targets)
- ✅ Testing infrastructure (Vitest v4, 6 test files, high coverage)

**Ready for deployment to Vercel**

## Documentation

**For AI Coding Assistants:**
- **`AGENTS.md`** - LLM-agnostic project context (use with Claude, Gemini, ChatGPT, Copilot, Cursor)
- **`CLAUDE.md`** - Claude Code-specific instructions (tool usage, task management)
- **`.cursorrules`** - Cursor-specific preferences (placeholder)
- **`.github/copilot-instructions.md`** - GitHub Copilot preferences (placeholder)

**For Humans:**
- **`README.md`** - This file (quick start and overview)
- **`/docs/`** - Comprehensive documentation (Diátaxis framework - coming soon)
  - `/docs/tutorials/` - Learning-oriented guides
  - `/docs/how-to/` - Problem-solving recipes
  - `/docs/reference/` - Technical specifications (API, components, database)
  - `/docs/explanation/` - Conceptual understanding (architecture, business model)
- **`supabase-schema.sql`** - Complete database schema
