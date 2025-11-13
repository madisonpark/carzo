# Carzo Documentation

This directory contains comprehensive documentation for the Carzo project, organized using the **Diátaxis framework** for optimal developer experience.

## Documentation Structure

### 📚 [tutorials/](./tutorials/) - Learning-Oriented

**For beginners who want to learn by doing**

Step-by-step guides that teach fundamental concepts through practical exercises.

- Getting Started (complete onboarding)
- Your First Migration (hands-on Supabase CLI)
- Adding a Filter (complete feature walkthrough)
- Understanding A/B Test Flows (flow routing deep dive)

**When to use**: You're new to the project or a specific area and want to learn the basics.

### 🔧 [how-to/](./how-to/) - Problem-Oriented

**For developers solving specific problems**

Practical recipes for common tasks and challenges.

- Add API Endpoint (complete pattern with rate limiting)
- Create Migration (Supabase CLI workflow)
- Add UI Component (component library pattern)
- Debug Rate Limiting (troubleshooting steps)
- Update Feed Sync (LotLinx integration changes)
- Deploy to Vercel (production setup)
- Monitoring (logs, analytics dashboard)
- Troubleshooting (common errors and solutions)

**When to use**: You know what you need to do and want the fastest path to completion.

### 📖 [reference/](./reference/) - Information-Oriented

**For developers who need precise technical specifications**

Detailed technical documentation for looking things up.

#### API Reference
- `api/search-vehicles.md` - PostGIS spatial queries
- `api/filter-options.md` - Dynamic filter generation
- `api/track-click.md` - Deduplication logic
- `api/track-impression.md` - A/B test flow tracking
- `api/detect-location.md` - MaxMind GeoIP integration
- `api/zipcode-lookup.md` - Zip to coordinates conversion
- `api/sync-feed.md` - LotLinx cron endpoint
- `api/cleanup-rate-limits.md` - Maintenance endpoint

Each includes: Request/response schemas, rate limits, error codes, curl examples

#### Component Reference
- `components/button.md` - 6 variants, sizes, icons
- `components/input.md` - Props, error states
- `components/badge.md` - 7 variants
- `components/card.md` - Compound components
- `components/overview.md` - Visual component gallery

#### Other Reference Docs
- `database-schema.md` - Tables, columns, indexes, RLS policies (with ERD)
- `environment-variables.md` - All env vars with descriptions
- `vercel-config.md` - Cron jobs, deployment settings
- `cli-scripts.md` - All /scripts documented
- `testing.md` - Vitest setup, conventions, coverage

**When to use**: You need to look up exact API parameters, component props, or configuration options.

### 💡 [explanation/](./explanation/) - Understanding-Oriented

**For developers who want to understand the "why"**

Conceptual documentation that explains design decisions and architecture.

- ✅ **Architecture Overview** - System design with diagrams
- ✅ **Business Model** - Revenue calculation, constraints, optimization
- **Dealer Diversification** - Algorithm explanation with visuals
- **Rate Limiting Strategy** - Why PostgreSQL over Redis
- **PostGIS Spatial Queries** - Performance optimization (100x faster)
- **Next.js 16 Decisions** - Framework choices (Turbopack, App Router)
- **Cookie Tracking** - Why cookies, not JWT
- **A/B Testing Flows** - Flow variants decision tree

**When to use**: You want to understand the rationale behind decisions or need the big picture.

### 🤝 [contributing/](./contributing/) - Contribution Guidelines

**For developers contributing to the project**

- `style-guide.md` - Tone, code snippets, markdown conventions
- `documentation-workflow.md` - When and how to update docs
- `documentation-governance.md` - Ownership, review, audits

**When to use**: You're contributing code or documentation and need to follow project standards.

## Quick Navigation

### I want to...

**...get the project running locally**
→ Start with [tutorials/getting-started.md](./tutorials/getting-started.md)

**...add a new API endpoint**
→ See [how-to/add-api-endpoint.md](./how-to/add-api-endpoint.md)

**...understand the revenue model**
→ Read [explanation/business-model.md](./explanation/business-model.md)

**...look up API request/response formats**
→ Check [reference/api/](./reference/api/)

**...understand the system architecture**
→ See [explanation/architecture-overview.md](./explanation/architecture-overview.md)

**...create a database migration**
→ Follow [how-to/create-migration.md](./how-to/create-migration.md)

**...add a new UI component**
→ Use [how-to/add-ui-component.md](./how-to/add-ui-component.md)

**...debug an issue**
→ Start with [how-to/troubleshooting.md](./how-to/troubleshooting.md)

## Documentation for AI Coding Assistants

**For LLMs (Claude, Gemini, ChatGPT, Copilot, Cursor):**
- Root: **`AGENTS.md`** - LLM-agnostic project context
- Root: **`CLAUDE.md`** - Claude Code-specific instructions

**For subdirectory-specific context:**
- `/components/CLAUDE.md` - UI component guidelines
- `/lib/CLAUDE.md` - Business logic guidelines
- `/app/api/CLAUDE.md` - API route guidelines

## Documentation Status

**Phase 1 Complete** (2025-11-12):
- ✅ AGENTS.md - LLM-agnostic context (354 lines)
- ✅ CLAUDE.md - Claude Code-specific (447 lines)
- ✅ Hierarchical CLAUDE.md files
- ✅ README.md updated

**Phase 2 Complete** (2025-11-13):
- ✅ All 8 Explanation docs
- ✅ All 9 API Reference docs
- ✅ All 5 Component Reference docs
- ✅ All 5 Other Reference docs (database, env vars, vercel config, CLI scripts, testing)
- ✅ All 8 How-To guides
- ✅ All 4 Tutorials
- ✅ Total: 39 comprehensive documentation files (15,851 lines)

**Phase 3 Planned**:
- Nextra documentation site
- Search functionality
- Branding & UX

## Contributing to Documentation

When adding or updating documentation:

1. **Choose the right category**:
   - Tutorial: Teaching beginners
   - How-To: Solving specific problems
   - Reference: Technical specifications
   - Explanation: Conceptual understanding

2. **Follow the style guide**:
   - Concise, technical, helpful
   - Code snippets in TypeScript
   - Examples before/after
   - Links to related docs

3. **Update this README** if adding new top-level docs

4. **Keep it current**: "Code change = doc change"

---

**For more information**, see:
- [AGENTS.md](../AGENTS.md) - Full project context
- [CLAUDE.md](../CLAUDE.md) - Claude Code instructions
- [contributing/documentation-workflow.md](./contributing/documentation-workflow.md) - How to update docs

**Last Updated**: 2025-11-13
