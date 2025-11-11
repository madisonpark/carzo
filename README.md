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

**Phase 1 Complete:**
- ✅ Next.js 16 project initialized
- ✅ Supabase schema created
- ✅ User tracking system (cookies)
- ✅ Dealer diversification algorithm

**Next Steps:**
- Feed sync script
- VDP bridge page
- Click tracking API
- Search results page
- Homepage

## Documentation

See `../lotlinx/CLAUDE.md` for project context and `supabase-schema.sql` for database schema.
