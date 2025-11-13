# Supabase Migration Workflow

**Last Updated:** 2025-11-12

This document outlines the proper workflow for managing database migrations using the Supabase CLI, eliminating the need to manually run SQL through the Supabase dashboard.

## Table of Contents
- [Overview](#overview)
- [Initial Setup](#initial-setup)
- [Daily Workflow](#daily-workflow)
- [Migration Commands](#migration-commands)
- [Troubleshooting](#troubleshooting)

## Overview

The Supabase CLI provides a complete migration management system that tracks which migrations have been applied locally and remotely. This prevents duplicate runs and allows safe iteration during development.

**Key Concepts:**
- **Local migrations** = SQL files in `supabase/migrations/`
- **Remote tracking** = Supabase maintains a `schema_migrations` table
- **Migration repair** = Sync CLI's understanding of what's been applied

## Initial Setup

### Prerequisites

```bash
# Install Supabase CLI (if not already installed)
brew install supabase/tap/supabase

# Verify installation
supabase --version
```

### Link to Your Remote Project

```bash
# Link to your Supabase project
supabase link --project-ref <your-project-ref>

# Find your project ref in Supabase Dashboard → Settings → General
```

### Check Migration Status

```bash
# View local and remote migration history
supabase migration list
```

**Expected output:**
```
Local          | Remote | Time (UTC)
---------------|--------|---------------------
20251111000000 | ✓      | 2025-11-11 00:00:00
20251112000003 |        | 2025-11-12 00:00:03  # Pending
```

## Daily Workflow

### 1. Creating a New Migration

When you need to make schema changes:

```bash
# Create a new migration file
supabase migration new <description>

# Example
supabase migration new add_user_preferences_table
```

This creates: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`

### 2. Write Your SQL

Edit the generated file with your DDL statements:

```sql
-- supabase/migrations/20251112120000_add_user_preferences_table.sql

CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  theme VARCHAR(20) DEFAULT 'light',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);
```

### 3. Test Locally (Optional but Recommended)

Start a local Supabase instance to test migrations:

```bash
# Start local Supabase (requires Docker, 7GB RAM)
supabase start

# Apply migrations to local database
supabase db reset

# Your Next.js app can connect to local Supabase:
# Local DB: postgresql://postgres:postgres@localhost:54322/postgres
# Local API: http://localhost:54321
```

**Benefits of local testing:**
- Catch errors before they hit production
- Faster iteration cycle
- No risk to production data

### 4. Apply to Remote Database

Once tested (or if skipping local testing):

```bash
# Preview what will be applied
supabase db push --dry-run

# Apply pending migrations to remote
supabase db push
```

**Interactive prompt:**
```
Do you want to push these migrations to the remote database?
 • 20251112120000_add_user_preferences_table.sql

 [Y/n] y
```

The CLI will:
1. Connect to your remote database
2. Check which migrations are already applied
3. Apply only the new ones
4. Update the tracking table

### 5. Verify Success

```bash
# Check that migration was applied
supabase migration list

# Should show ✓ in Remote column
```

## Migration Commands

### Core Commands

```bash
# List all migrations
supabase migration list

# Create new migration
supabase migration new <name>

# Apply pending migrations to remote
supabase db push

# Preview changes before applying
supabase db push --dry-run

# Pull schema from remote (reverse sync)
supabase db pull

# Reset local database to current migrations
supabase db reset
```

### Advanced Commands

```bash
# Repair migration history (mark migrations as applied)
supabase migration repair --status applied <timestamp>
supabase migration repair --status reverted <timestamp>

# Generate migration from schema diff
supabase db diff -f <migration-name>

# Squash multiple migrations into one
supabase migration squash
```

## Troubleshooting

### Problem: `supabase db push` tries to re-run old migrations

**Error:**
```
ERROR: relation "vehicles" already exists (SQLSTATE 42P07)
```

**Cause:** Supabase CLI doesn't know which migrations were already applied (run manually via dashboard).

**Solution:** Use `migration repair` to mark them as applied:

```bash
# Check current status
supabase migration list

# Mark specific migration as applied
supabase migration repair --status applied 20251111000000

# Or mark ALL migrations up to a certain point
supabase migration repair --status applied 20251112000005
```

After repair, `supabase migration list` should show ✓ in the Remote column.

### Problem: Migration has syntax errors

**Symptoms:**
- `db push` fails with PostgreSQL error
- Function won't create
- Reserved word conflicts (e.g., `trim`, `user`, `order`)

**Solutions:**

**1. Reserved Words**
```sql
-- ❌ Bad
CREATE TABLE vehicles (
  trim VARCHAR(100)  -- 'trim' is reserved
);

-- ✅ Good
CREATE TABLE vehicles (
  "trim" VARCHAR(100)  -- Escaped with quotes
);
```

**2. Type Mismatches**
```sql
-- ❌ Bad (returns VARCHAR[] when function declares TEXT[])
RETURNS TABLE (makes TEXT[])
SELECT ARRAY(SELECT DISTINCT make FROM vehicles);

-- ✅ Good (explicit casting)
SELECT ARRAY(SELECT DISTINCT make::TEXT FROM vehicles);
```

**3. Function Signature Errors**
```sql
-- ❌ Bad (wrong parameter types)
pg_advisory_xact_lock(hash_int, epoch_bigint)

-- ✅ Good (both must be INTEGER)
pg_advisory_xact_lock(hash_int, epoch_int::INTEGER)
```

### Problem: Need to update an existing function

**Option 1: Create a new migration (recommended)**
```bash
supabase migration new fix_search_function

# In the migration file:
CREATE OR REPLACE FUNCTION search_vehicles_by_location(...)
RETURNS TABLE (...) AS $$
  -- Updated function body
$$ LANGUAGE plpgsql;

supabase db push
```

**Option 2: Direct SQL via CLI**
```bash
# Run SQL directly on remote database
supabase db execute --file my-fix.sql
```

### Problem: Local and remote are out of sync

**Solution:** Pull remote schema and generate diff:

```bash
# Pull current remote schema
supabase db pull

# This updates: supabase/migrations/<timestamp>_remote_schema.sql

# Generate migration from diff
supabase db diff -f sync_with_remote

# Review the generated migration, then push
supabase db push
```

## Best Practices

### ✅ DO

1. **Always use migrations for schema changes**
   - Never manually ALTER tables in production
   - All changes tracked in version control

2. **Test locally when possible**
   ```bash
   supabase start
   supabase db reset  # Applies all migrations
   ```

3. **Use descriptive migration names**
   ```bash
   supabase migration new add_vehicle_search_index
   # Not: supabase migration new update
   ```

4. **Use `CREATE OR REPLACE` for functions**
   - Allows updating functions in new migrations
   - Safer than DROP + CREATE

5. **Mark manually-run migrations**
   ```bash
   # If you ran SQL via dashboard, repair tracking:
   supabase migration repair --status applied <timestamp>
   ```

6. **Review before pushing**
   ```bash
   supabase db push --dry-run  # Preview first
   ```

### ❌ DON'T

1. **Don't skip migration tracking**
   - Running SQL manually breaks the migration history
   - Always create a migration file

2. **Don't modify old migrations**
   - Once applied to production, never change
   - Create a new migration to fix issues

3. **Don't commit sensitive data**
   - Use environment variables in `config.toml`
   - Never commit passwords or API keys

4. **Don't force push without checking**
   - Always use `--dry-run` first
   - Verify changes with `migration list`

## Migration File Structure

### Anatomy of a Migration

```sql
-- Migration: <Short description>
-- Purpose: <Why this change is needed>
-- Performance: <Any performance considerations>

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create tables
CREATE TABLE IF NOT EXISTS my_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_my_table_created
ON my_table(created_at);

-- Create functions
CREATE OR REPLACE FUNCTION my_function()
RETURNS TABLE (...) AS $$
BEGIN
  -- Function body
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION my_function TO authenticated, anon;

-- Add comments
COMMENT ON TABLE my_table IS 'Description of table purpose';
COMMENT ON FUNCTION my_function IS 'Description of function';
```

### Key Patterns

**Use IF NOT EXISTS:**
```sql
CREATE TABLE IF NOT EXISTS ...
CREATE INDEX IF NOT EXISTS ...
```

**Use OR REPLACE for functions:**
```sql
CREATE OR REPLACE FUNCTION ...
```

**Escape reserved words:**
```sql
"user", "order", "trim", "limit", "offset"
```

**Explicit type casting:**
```sql
column_name::TEXT
column_name::INTEGER
```

## Example: Complete Migration Workflow

### Scenario: Add full-text search to vehicles

```bash
# 1. Create migration
supabase migration new add_vehicle_fulltext_search

# 2. Edit the file
cat > supabase/migrations/20251112130000_add_vehicle_fulltext_search.sql <<'EOF'
-- Add tsvector column for full-text search
ALTER TABLE vehicles ADD COLUMN search_vector tsvector;

-- Create GIN index for fast text search
CREATE INDEX idx_vehicles_search ON vehicles USING GIN(search_vector);

-- Create trigger to auto-update search_vector
CREATE OR REPLACE FUNCTION update_vehicle_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.make, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.model, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW."trim", '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vehicle_search_vector
  BEFORE INSERT OR UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_search_vector();

-- Backfill existing records
UPDATE vehicles SET search_vector =
  setweight(to_tsvector('english', COALESCE(make, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(model, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE("trim", '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'C');
EOF

# 3. Test locally (optional)
supabase start
supabase db reset
# Test your app against local database

# 4. Preview changes
supabase db push --dry-run

# 5. Apply to production
supabase db push

# 6. Verify
supabase migration list
# Should show ✓ in Remote column
```

## Reference Links

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Local Development Guide](https://supabase.com/docs/guides/local-development)
- [Migration Management](https://supabase.com/docs/guides/cli/managing-environments)
- [PostgreSQL Reserved Words](https://www.postgresql.org/docs/current/sql-keywords-appendix.html)

---

**Questions or issues?** File an issue in this repo or consult the [Supabase Discord](https://discord.supabase.com).
