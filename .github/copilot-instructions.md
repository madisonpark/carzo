# GitHub Copilot Instructions for Carzo

## Primary Context

**See AGENTS.md for complete project context** (LLM-agnostic, works with all AI assistants).

This file contains **GitHub Copilot-specific preferences** (placeholder for now).

---

## Copilot-Specific Settings (To Be Configured)

When using GitHub Copilot for this project, consider:

1. **Always reference AGENTS.md** for project context
2. **Follow branch-based workflow** (never commit to main)
3. **Include tests with code suggestions** (all functions need tests)
4. **Use semantic color tokens** (bg-primary, bg-brand, not hard-coded)
5. **Mobile-first approach** (base styles for 320px+, lg: for desktop)

## Code Style for Suggestions

- TypeScript strict mode (explicit return types)
- Server Components by default (Next.js 16 App Router)
- Semantic color tokens from Tailwind v4 design system
- cn() utility for conditional classes
- React.forwardRef pattern for reusable UI components

## Testing Patterns

- Unit tests in `__tests__/` colocated with source
- Use Vitest v4 (not Jest)
- Mock Supabase, fetch, window APIs
- Deterministic fixtures (no random data)
- 95%+ coverage for revenue-critical files

## Revenue-Critical Functions (Extra Care)

- `lib/dealer-diversity.ts` - DO NOT MODIFY without approval
- `lib/user-tracking.ts` - Cookie-based tracking (1 year expiration)
- `lib/flow-detection.ts` - A/B test flow routing
- `app/api/track-click/route.ts` - Click deduplication logic

---

**Last Updated:** 2025-11-12
**See AGENTS.md for full project context**
