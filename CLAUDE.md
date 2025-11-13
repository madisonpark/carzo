# Claude Code Instructions for Carzo

## Primary Context

**See AGENTS.md for complete project context:**
- Project overview & business model
- Tech stack with versions
- Critical commands
- Project structure
- Business rules (dealer diversification, revenue model)
- Code conventions
- Common gotchas
- Architecture references

This file contains **Claude Code-specific instructions** for tool usage, task management, and workflow preferences.

---

## Claude Code-Specific Behavior

### Tool Usage Policy

**When to use specialized tools:**
- **Task tool with Explore agent**: For codebase exploration (NOT needle queries for specific files/classes)
  - Example: "Where are errors handled?" → Use Explore agent
  - Example: "What is the codebase structure?" → Use Explore agent
  - Example: "Find class Foo" → Use Glob tool directly (needle query)

- **Proactive agent usage**: Launch agents automatically when user intent matches:
  - Database/schema work → `supabase-schema-architect` agent
  - Codebase exploration → Task tool with `Explore` subagent

**Specialized tools over Bash:**
- **Read** for reading files (not `cat`/`head`/`tail`)
- **Edit** for editing files (not `sed`/`awk`)
- **Write** for creating files (not `echo >`/`cat <<EOF`)
- **Grep** for searching (not `grep`/`rg`)
- **Glob** for finding files (not `find`/`ls`)

**NEVER use Bash for:**
- Communication with user (`echo` → output text directly)
- File operations (use dedicated tools above)

**Bash is ONLY for:**
- Git commands
- npm/npx commands
- Supabase CLI commands
- Docker commands
- Terminal operations that require shell

### Task Management (TodoWrite)

**ALWAYS use TodoWrite for:**
- Multi-step tasks (3+ steps)
- Complex features requiring planning
- User provides multiple tasks (numbered or comma-separated)

**When NOT to use TodoWrite:**
- Single, straightforward tasks
- Trivial tasks (< 3 steps)
- Purely conversational/informational requests

**Todo Management Rules:**
- **Exactly ONE todo in_progress at a time** (not less, not more)
- **Mark todos completed immediately** after finishing (don't batch)
- Use `content` (imperative: "Run tests") and `activeForm` (continuous: "Running tests")
- Update task status in real-time as you work

**Task Completion Requirements:**
- ONLY mark as completed when FULLY accomplished
- If errors/blockers occur, keep as in_progress
- Create new task for blockers/issues
- Never mark completed if:
  - Tests are failing
  - Implementation is partial
  - Unresolved errors exist
  - Missing files/dependencies

### File Operations

**ALWAYS prefer editing existing files:**
- Use **Edit tool** for existing files (NOT Write)
- Use **Write tool** ONLY for new files
- **Read file before editing** (required by Edit tool)

**NEVER proactively create:**
- Documentation files (`*.md`, `README.md`)
- Unless explicitly requested by user

### Documentation Best Practices

**Follow Diátaxis framework** (see `/docs/README.md`):
- **Tutorials** (`/docs/tutorials/`) - Step-by-step learning guides
- **How-To** (`/docs/how-to/`) - Problem-solving recipes
- **Reference** (`/docs/reference/`) - Technical specifications
- **Explanation** (`/docs/explanation/`) - Conceptual "why" documentation

**CRITICAL: Never hardcode data that changes:**
- ❌ **NO**: "We have 72,000 vehicles" (inventory changes daily)
- ❌ **NO**: "Sitemap has 1,002 URLs" (grows with inventory)
- ✅ **YES**: "Vehicle inventory (varies)"
- ✅ **YES**: "Up to 50,000 URLs per sitemap (Google's limit)"

**Before documenting:**
1. Verify current behavior (don't assume from old code/docs)
2. Test endpoints/features locally
3. Use relative/generic terms for variable data
4. Reference limits/constraints, not current values

**CLAUDE.md vs detailed docs:**
- CLAUDE.md: Quick reference + pointer to detailed doc
- `/docs/explanation/`: Full details, rationale, examples

### Git Workflow Enforcement

**CRITICAL RULES:**
- **NEVER commit to main branch directly**
- **NEVER force push to main**
- **All work on feature/fix branches**
- **Create PR for all changes** (never merge directly)

**Branch naming:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring
- `test/` - Test additions

**Commit format:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Refactoring
- `test:` - Tests
- `chore:` - Maintenance

**Pre-commit checks:**
1. Verify on feature/fix branch (not main)
2. Code builds (`npm run build`)
3. No TypeScript errors
4. No secrets committed (use SECRETS.md pattern)
5. Descriptive commit message

### Testing Requirements (CRITICAL)

**⚠️ ALL code changes require tests**

**Test Coverage Rules:**
- ✅ Every new function → corresponding test file
- ✅ Every updated function → updated tests
- ✅ Every new component → component tests
- ✅ Every new API route → API route tests
- ❌ Never commit code without tests (except docs/config/types)

**Testing Workflow:**
1. Write tests first (TDD preferred) or immediately after implementation
2. Run `npm test` after code changes
3. Ensure all tests pass before committing
4. Run `npm run test:coverage` to verify thresholds
5. Aim for **80%+ coverage** on new/modified files

**Test Structure:**
- Tests in `__tests__/` folders colocated with source
- Example: `lib/utils.ts` → `lib/__tests__/utils.test.ts`
- Example: `components/ui/Button.tsx` → `components/ui/__tests__/Button.test.tsx`
- Example: `app/api/track-click/route.ts` → `app/api/track-click/__tests__/route.test.ts`

**Test Standards:**
- ✅ Use **Vitest v4** for all tests
- ✅ Use **@testing-library/react** for component tests
- ✅ Mock external dependencies (Supabase, fetch, window APIs)
- ✅ Use **deterministic fixtures** (no random data, fixed timestamps)
- ✅ Test edge cases and error scenarios
- ✅ Tests must be **deterministic** (no flaky tests)
- ✅ Use `vi.useFakeTimers()` for time-sensitive logic
- ❌ No `any` types in tests - use proper TypeScript

**Revenue-Critical Files Require 95% Coverage:**
- `lib/dealer-diversity.ts` - Round-robin dealer algorithm (THE MONEY ALGORITHM)
- `lib/flow-detection.ts` - A/B testing flow routing
- `lib/user-tracking.ts` - Cookie-based user tracking
- `app/api/track-click/route.ts` - Click tracking API (future)

**Quick Commands:**
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
npm run test:ui         # Vitest UI (visual debugger)
npm test path/to/test   # Run specific test
```

### Mobile-First Development

**Always consider mobile:**
- Base styles for mobile (320px+)
- Use `lg:` breakpoint for desktop (1024px)
- Touch targets minimum 40x40px (WCAG Level AAA)
- Test at 375px, 768px, 1024px+

**Responsive patterns:**
```tsx
// Stacks on mobile, horizontal on desktop
<div className="flex flex-col lg:flex-row gap-3">

// Full width on mobile, auto on desktop
<Button className="w-full lg:w-auto">

// Small text on mobile, large on desktop
<h1 className="text-3xl lg:text-5xl">
```

### Performance Targets

When implementing features, aim for:
- **Homepage LCP**: < 1.5s
- **Search results response**: < 1s
- **VDP LCP**: < 2s
- **Database queries**: < 100ms p95
- **PostGIS spatial queries**: ~50-100ms

### SEO & Crawlability

**Files:**
- `app/robots.ts` - Dynamic robots.txt (blocks `/admin/*`, `/api/*`, `/search?*`, `/*?flow=*`)
- `app/sitemap.ts` - Dynamic sitemap.xml (queries Supabase for active vehicles)

**When adding new pages:**
- Add metadata with `generateMetadata()` (title, description, OpenGraph)
- Consider structured data (JSON-LD) for rich snippets
- Update `app/sitemap.ts` if creating new public route category

**See:** `@/docs/explanation/seo-crawlability.md` for detailed SEO strategy, robots.txt rules, and sitemap configuration

### Domain Constraints (Revenue Optimization)

**MOST IMPORTANT RULE:**
- **$0.80 per UNIQUE dealer click per user per 30 days**
- Multiple clicks to same dealer = paid ONCE
- **dealer_id tracking is CRITICAL** for all dealer clicks

**Dealer Diversification Requirements:**
- Apply to ALL vehicle lists (search, featured, related)
- Use `diversifyByDealer()` function from `lib/dealer-diversity.ts`
- Max 1-2 vehicles per dealer per page
- Target: >80% dealer diversity score
- **DO NOT MODIFY `lib/dealer-diversity.ts` without explicit approval** (revenue-critical)

**All Dealer Links:**
- Must open in new tab: `target="_blank" rel="noopener noreferrer"`
- Must call `/api/track-click` before opening
- Pass: `dealer_id`, `vehicle_id`, `user_id`, `session_id`
- Check `is_billable` flag in response

### Security Requirements

**Always check for:**
- **SQL injection**: Use parameterized queries
- **XSS**: Sanitize user inputs
- **Secrets**: Never commit (use `.env.local`, gitignored)
- **Rate limiting**: All POST endpoints must call `checkMultipleRateLimits()`

**Rate Limiting Pattern:**
```typescript
import { getClientIdentifier, checkMultipleRateLimits, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);

  const rateLimitResult = await checkMultipleRateLimits(identifier, [
    { endpoint: 'endpoint_name', ...RATE_LIMITS.SEARCH_VEHICLES },
    { endpoint: 'endpoint_name_burst', ...RATE_LIMITS.BURST },
  ]);

  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // Proceed with request...
}
```

### File Boundaries

**DO NOT EDIT:**
- `/reference_vdp/` - Archived reference implementation
- `/docs/archive/` - Historical QA reports
- `CLAUDE.md.old` - Old documentation (deprecated)

**ALWAYS EDIT:**
- `/app`, `/components`, `/lib` - Main codebase
- `/docs/` - Active documentation
- `/supabase/migrations/` - Database migrations (via Supabase CLI)

### Code Examples & Patterns

**See external docs for detailed patterns:**
- API endpoint pattern: `@/docs/how-to/add-api-endpoint.md`
- Component pattern: `@/components/ui/Button.tsx` (forwardRef, Slot, cn())
- Migration workflow: `@/docs/how-to/create-migration.md`
- Testing patterns: See Testing section above

**UI Component Usage:**
```tsx
import { Button, Input, Badge, Card } from '@/components/ui';

// ALWAYS use semantic colors (not hard-coded)
<Button variant="primary">Primary CTA</Button>  // Red
<Button variant="brand">Brand Action</Button>   // Blue
<Badge variant="success">Certified</Badge>      // Green

// ALWAYS use cn() for conditional classes
import { cn } from '@/lib/utils';
<div className={cn(
  'p-4 rounded-lg',
  isActive && 'bg-brand text-white',
  !isActive && 'bg-muted'
)}>
```

**Accessibility:**
```tsx
// ALWAYS use focus-visible: (not focus:) for keyboard-only focus
<input className="focus-visible:ring-2 focus-visible:ring-brand" />

// NEVER use focus: (shows on mouse clicks)
<input className="focus:ring-2" />  // ❌ WRONG
```

### Next.js 16 Specifics

**Critical differences:**
- **Dynamic route params are async**: Must `await params` in page components
- **Suspense boundaries required**: For `useSearchParams()`
- **`middleware.ts` renamed**: Now `proxy.ts` (Node.js runtime by default)
- **Turbopack is default**: For dev (2-5x faster)

**Example:**
```tsx
// Page component (Next.js 16)
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;  // MUST await
  // ...
}
```

### PostGIS & Supabase

**PostGIS Spatial Queries:**
- **`location` column auto-updated** via trigger
- **Use GIST spatial index** for radius queries (100x faster)
- **Always use `ST_DWithin`** for distance queries (not client-side Haversine)
- **`targeting_radius` field** per vehicle (default 30 miles)

**Supabase CLI (CRITICAL):**
- **Use CLI for ALL database work** (not manual dashboard SQL)
- `supabase db push` - Apply migrations
- `supabase db pull` - Pull schema from remote
- `supabase db execute` - Run ad-hoc SQL
- `supabase start` - Local Supabase (Docker)

**Common Gotchas:**
- **Reserved words** need quotes (e.g., `"interval"`)
- **Type casting required** for GEOGRAPHY, JSONB columns
- **Always test locally** before pushing to remote

### Question-Driven Improvement

**When you make a mistake:**
1. Update this CLAUDE.md to prevent future occurrences
2. Add to "Common Gotchas" section
3. Create test case to catch the issue

**Example:** If you forget to await params in Next.js 16, add reminder to this file.

---

## Integration with Other LLMs

**For use with other AI coding assistants:**
- **Gemini/ChatGPT**: Provide AGENTS.md (LLM-agnostic)
- **Cursor**: See `.cursorrules` (placeholder for now)
- **GitHub Copilot**: See `.github/copilot-instructions.md` (placeholder for now)

**AGENTS.md vs CLAUDE.md:**
- **AGENTS.md**: Generic context (works with ALL LLMs)
- **CLAUDE.md**: Claude Code-specific (tool usage, TodoWrite, etc.)

---

## Quick Reference

### Critical Files to Know
- `AGENTS.md` - Main project context (LLM-agnostic)
- `lib/dealer-diversity.ts` - Revenue-critical algorithm (DO NOT MODIFY without approval)
- `lib/user-tracking.ts` - Cookie-based tracking
- `lib/flow-detection.ts` - A/B test flow routing
- `lib/rate-limit.ts` - PostgreSQL rate limiting
- `app/api/track-click/route.ts` - Click deduplication
- `components/ui/` - UI component library
- `app/globals.css` - Tailwind v4 design system

### Most Common Commands
```bash
# Development
npm run dev              # Start dev server (Turbopack)
npm run build            # Production build
npm test                 # Run tests
npm run test:watch       # Watch mode

# Database
supabase start           # Local Supabase
supabase db push         # Apply migrations
supabase db pull         # Pull schema

# Git
git branch --show-current  # Check current branch
git checkout -b feature/name  # Create feature branch
git push -u origin feature/name  # Push branch
```

### Most Common Patterns

**1. Adding a New API Endpoint:**
- Create route in `/app/api/[endpoint]/route.ts`
- Add rate limiting (see Security section above)
- Add tests in `/app/api/[endpoint]/__tests__/route.test.ts`
- Document in `/docs/reference/api/[endpoint].md` (future)

**2. Adding a New UI Component:**
- Create in `/components/ui/[Component].tsx`
- Use forwardRef pattern
- Support className prop (cn() utility)
- Add to `/components/ui/index.ts` export
- Add tests in `/components/ui/__tests__/[Component].test.tsx`

**3. Adding a Database Migration:**
- Create SQL file in `/supabase/migrations/`
- Name: `YYYYMMDDHHMMSS_description.sql`
- Test locally: `supabase start` → `supabase db push`
- Push to remote: `supabase db push`

**4. Tracking a Dealer Click:**
```typescript
// Before opening dealer link
const response = await fetch('/api/track-click', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    vehicleId: vehicle.id,
    dealerId: vehicle.dealer_id,
    userId: getUserId(),
    sessionId: getSessionId(),
  }),
});

const { billable } = await response.json();

// Then open dealer link in new tab
window.open(vehicle.dealer_vdp_url, '_blank', 'noopener,noreferrer');
```

---

## Reminder: Keep This File Concise

**Target: 400 lines (~20KB)**

When this file grows too large:
1. Move detailed explanations to `/docs/explanation/`
2. Move how-to guides to `/docs/how-to/`
3. Move API reference to `/docs/reference/api/`
4. Use `@docs/path/to/file.md` references instead of embedding

**Goal:** This file should contain ONLY Claude Code-specific instructions, not project documentation.

---

**Last Updated:** 2025-11-12
**See AGENTS.md for complete project context and architecture**
