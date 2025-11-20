# Deployment Strategy: Local to Vercel

## 1. Overview
This document outlines the strategy for deploying the Carzo application from a local development environment to Vercel production. It covers environment setup, database synchronization, and verification steps.

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

## 4. Deployment Steps

### Phase 1: Production Database Setup
1.  **Link Supabase:** Connect local CLI to production instance.
    ```bash
    supabase link --project-ref <prod-project-ref>
    ```
2.  **Apply Migrations:** Push schema to production.
    ```bash
    supabase db push
    ```
3.  **Verify PostGIS:** Ensure extensions are active.
    ```sql
    select * from pg_extension where extname = 'postgis';
    ```

### Phase 2: Vercel Configuration
1.  **Environment Variables:** Set all keys from `.env.example` in Vercel Project Settings.
    *   *Critical:* `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`.
    *   *Update:* Add `NEXT_PUBLIC_FB_PIXEL_ID` (newly added feature).
2.  **Cron Jobs:** Vercel automatically parses `vercel.json`.
    *   *Note:* Ensure the schedule in `vercel.json` aligns with business needs (currently 4x daily).

### Phase 3: Build & Deploy
1.  **Push to Main:** Merging to `main` triggers Vercel deployment.
2.  **Build Verification:** Monitor Vercel logs for:
    *   `Next.js build ...`
    *   `Route (app) ...`
    *   No `Type error` or `Lint error`.

### Phase 4: Post-Deployment Verification (Smoke Test)
1.  **Frontend:** Visit `carzo.net`.
    *   Search works?
    *   VDP loads?
    *   Pixel fires? (Use Pixel Helper).
2.  **Cron:** Trigger manually or wait for scheduled run.
    *   Check `feed_sync_logs` table for success entry.
3.  **Admin:** Login to `/admin` and check analytics.

## 5. Rollback Strategy
*   **Instant Rollback:** Use Vercel's "Instant Rollback" feature to revert to the previous deployment ID if critical errors occur.
*   **Database Rollback:** Manual SQL execution or `supabase db reset` (extreme caution required).

## 6. Documentation Updates
*   **`docs/how-to/deploy-to-vercel.md`**: This existing guide is comprehensive. We will use it as the primary execution manual.
*   **`vercel.json`**: Ensure cron schedules are accurate.

## 7. Discrepancy Note
*   **Cron Schedule:** `vercel.json` lists one job (`sync-feed`), documentation mentions two. We will prioritize `vercel.json` as the source of truth and update docs if needed during the process.
