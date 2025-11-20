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
  - **Tests not written for revenue-critical code** (see Testing Requirements)
  - **Coverage below threshold for revenue-critical code** (95% required)
  - Implementation is partial
  - Unresolved errors exist
  - Missing files/dependencies
- May mark completed without tests if noted in PR description for follow-up

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

**CRITICAL: Never hardcode volatile data in documentation:**
- ❌ **NO**: "We have 72,000 vehicles" (inventory changes daily)
- ❌ **NO**: "Sitemap has 1,002 URLs" (grows with inventory)
- ❌ **NO**: "27 tests passed" (test count changes as code evolves)
- ❌ **NO**: "Search returned 127 results" (query-dependent)
- ✅ **YES**: "Vehicle inventory (varies)"
- ✅ **YES**: "Up to 50,000 URLs per sitemap (Google's limit)"
- ✅ **YES**: "All tests passing" or "75+ component tests"
- ✅ **YES**: Constants are fine: `const MAX_RESULTS = 100`

**What counts as "volatile data":**
- Current inventory counts
- Active user/session counts
- Test result numbers (unless describing a specific test run)
- Search/query result counts
- Database row counts
- Anything that changes with normal operation

**What's OK to hardcode:**
- System limits/constraints (Google's 50K sitemap limit)
- Configuration constants (max page size, timeout values)
- Business rules ($0.80 per click, 30-day deduplication)
- API response codes (200, 404, 429)
- Fixed thresholds (80% coverage target)

**Before documenting:**
1. Ask: "Will this number change during normal operation?"
2. If YES → use generic terms ("varies", "multiple", "up to X limit")
3. If NO → it's a constant/constraint, OK to document

**CLAUDE.md vs detailed docs:**
- CLAUDE.md: Quick reference + pointer to detailed doc
- `/docs/explanation/`: Full details, rationale, examples

### Git Workflow Enforcement

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
4. **Tests passing** (if tests exist) - `npm test`
5. **Revenue-critical code has tests and meets 95% coverage** (required)
6. No secrets committed (use SECRETS.md pattern)
7. Descriptive commit message
8. Note in PR description if tests deferred to follow-up PR

**PR Review Workflow:**
1. Create PR on feature branch
2. Wait for AI bot reviews (gemini-code-assist, claude)
3. Address feedback with code changes
4. Add PR comment tagging bot(s) explaining changes
5. Wait for user's explicit "merge" command
6. NEVER merge without user approval

### Testing Requirements (CRITICAL)

**⚠️ Prioritize testing, especially for revenue-critical code**

**Test Coverage Rules:**
- ✅ Every new function → corresponding test file (when practical)
- ✅ Every updated function → updated tests (when practical)
- ✅ Every new component → component tests (when practical)
- ✅ Every new API route → API route tests (when practical)
- ⚠️ Prefer tests with code, but acceptable to commit without tests when:
  - Rapid prototyping or experimentation
  - Minor refactoring or code cleanup
  - Documentation, config, or type-only changes
  - Tests would be added in a follow-up PR (note in PR description)
- ❌ Revenue-critical code MUST have tests before committing (no exceptions):
  - `lib/dealer-diversity.ts`
  - `lib/user-tracking.ts`
  - `lib/flow-detection.ts`
  - `app/api/track-click/route.ts`

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

### Testing Phases Status

**Phase 1 COMPLETE** (Testing Infrastructure):
- ✅ Vitest v4 configuration with happy-dom
- ✅ @testing-library/react v16 (React 19 compatible)
- ✅ tests/setup.ts with all mocks (window, storage, fetch, observers)
- ✅ Coverage thresholds enforced in vitest.config.ts
- ✅ Test utilities and helpers

**Phase 2 COMPLETE** (Revenue-Critical Unit Tests):
- ✅ lib/dealer-diversity.ts (97.61% coverage, 35 tests)
- ✅ lib/user-tracking.ts (100% coverage, 48 tests)
- ✅ lib/flow-detection.ts (100% coverage, 61 tests)
- ✅ lib/rate-limit.ts (88.9% coverage)
- ✅ lib/geolocation.ts (92.3% coverage)
- ✅ lib/utils.ts (100% coverage)

**Phase 3 COMPLETE** (API Route Tests):
- ✅ app/api/track-click/__tests__/route.test.ts
- ✅ app/api/track-impression/__tests__/route.test.ts
- ✅ app/api/zipcode-lookup/__tests__/route.test.ts
- ⏳ Remaining routes (search-vehicles, filter-options, etc.)

**Phase 4 COMPLETE** (UI Component Tests):
- ✅ components/ui/__tests__/Button.test.tsx
- ✅ components/ui/__tests__/Input.test.tsx
- ✅ components/ui/__tests__/Badge.test.tsx
- ✅ components/ui/__tests__/Card.test.tsx
- ✅ components/layout/__tests__/Header.test.tsx (29 tests)
- ✅ components/layout/__tests__/Footer.test.tsx (29 tests)
- ✅ components/layout/__tests__/ThemeToggle.test.tsx (17 tests)
- ⏳ Feature components (VehicleCard, FilterSidebar, etc.)

**Phase 5 PLANNED** (Integration Tests):
- ⏳ End-to-end dealer click flow
- ⏳ Feed sync workflow
- ⏳ Search → VDP → Click flow

**Phase 6 PLANNED** (E2E Tests with Playwright):
- ⏳ Critical user journeys
- ⏳ A/B test flow variants
- ⏳ Mobile responsiveness

**Phase 7 PLANNED** (CI/CD Integration):
- ⏳ GitHub Actions workflow
- ⏳ Pre-commit hooks (Husky)
- ⏳ Automated coverage enforcement

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
