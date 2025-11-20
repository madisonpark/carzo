# Gemini Agent Instructions for Carzo

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

This file contains **Gemini-specific instructions** for tool usage, task management, and workflow preferences.

---

## Gemini-Specific Behavior

### Tool Usage Policy

**Preferred Tooling Strategy:**
- **Complex Exploration**: Use `codebase_investigator` for architectural mapping, vague requests, or root-cause analysis. Do not rely solely on grep/search for understanding system-wide patterns.
- **Task Management**: Use `write_todos` for ANY task involving more than 2 steps. Keep the todo list updated in real-time.
- **File Search**: Use `glob` to find files by pattern and `search_file_content` (ripgrep) for finding specific code patterns.
- **File Operations**:
    - `read_file`: Always read a file before editing it.
    - `replace`: Use for targeted edits. Ensure 3 lines of context match exactly.
    - `write_file`: Use for creating new files.

### Task Management (write_todos)

**ALWAYS use `write_todos` when:**
- Implementing a feature spanning multiple files.
- Refactoring code.
- The user request implies a multi-step process (e.g., "Set up the new API endpoint").

**Todo Management Rules:**
- Break down complex tasks into atomic subtasks.
- Mark only **one** task as `in_progress` at a time.
- Update the status to `completed` or `cancelled` promptly.
- If a blocker arises, add a new subtask to resolve it or mark the current one as `pending` while you investigate.

### Codebase Investigation

**When to use `codebase_investigator`:**
- "How does the dealer diversification algorithm work?"
- "Where is the entry point for the feed sync?"
- "Analyze the dependency structure of the search component."

Do NOT use it for simple queries like "Find the definition of function X" (use `search_file_content` or `glob`).

---

## Git Workflow Enforcement

**CRITICAL RULES (ALWAYS ENFORCED - see AGENTS.md for full details):**

1.  **NEVER work on main branch directly**
    - **ALL work must happen on a feature/fix/docs branch**
    - Only exception: User explicitly says "work on main"
    - Create branch BEFORE making any changes: `git checkout -b feature/name`

2.  **NEVER merge PRs without explicit user approval**
    - Create PR and wait for user's "merge" command
    - **DO NOT auto-merge**

3.  **Commit Messages**
    - Format: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
    - Be descriptive but concise.

4.  **Pushing**
    - Do not push to remote unless explicitly asked or if it's a necessary step in the defined workflow (e.g. "Create a PR").

### Pull Request Standards

**PR Structure:**
When using `gh pr create`, ensure the body includes:
1.  **Summary**: High-level overview of the problem and solution.
2.  **Key Changes**: Bullet points of specific file/logic modifications.
3.  **Impact**: Revenue, UX, or performance implications.
4.  **Verification**: Checklist of tests run (`[x] ...`) and confirmation of build/lint passes.

**Review Workflow:**
- **Wait for Reviews**: AI bots (gemini-code-assist, claude) and humans will review.
- **Respond to Feedback**:
    - Address every comment.
    - Tag the reviewer in your reply: `@gemini-code-assist Fixed type safety...` or `@claude Explained why...`.
    - **NEVER** merge without an explicit "merge" command from the user.

---

## Testing Requirements (CRITICAL)

**⚠️ Prioritize testing, especially for revenue-critical code**

**Revenue-Critical Files Require 95% Coverage:**
- `lib/dealer-diversity.ts` - Round-robin dealer algorithm (THE MONEY ALGORITHM)
- `lib/flow-detection.ts` - A/B testing flow routing
- `lib/user-tracking.ts` - Cookie-based user tracking
- `app/api/track-click/route.ts` - Click tracking API

**General Rules:**
- **New Features**: Must include tests.
- **Bug Fixes**: Must include a regression test.
- **Running Tests**: Use `npm test` or `npm run test:coverage`.

---

## Domain Constraints (Revenue Optimization)

**MOST IMPORTANT RULE:**
- **$0.80 per UNIQUE dealer click per user per 30 days**
- **dealer_id tracking is CRITICAL** for all dealer clicks.

**Dealer Diversification:**
- Apply `diversifyByDealer()` from `lib/dealer-diversity.ts` to ALL vehicle lists.
- **DO NOT MODIFY `lib/dealer-diversity.ts` without explicit approval.**

**External Links:**
- All dealer links must be `target="_blank" rel="noopener noreferrer"`.
- Must call `/api/track-click` before opening.

---

## Documentation Best Practices

- **Do not hardcode volatile data** (e.g., inventory counts, active users). Use generic descriptions instead of specific numbers.
    - ❌ **NO**: "We have 72,000 vehicles"
    - ✅ **YES**: "Vehicle inventory varies daily"
- Constants and business rules are OK to state (e.g., `$0.80 per click`, `95% test coverage`).
- Follow the **Diátaxis framework** (see `/docs/README.md`).
- Keep `gemini.md` concise. Refer to `AGENTS.md` for shared context.

---

## Quick Reference

**Common Commands:**
```bash
npm run dev              # Start dev server
npm run build            # Production build
npm test                 # Run tests
supabase start           # Local Supabase
supabase db push         # Apply migrations
```

**Key Files:**
- `AGENTS.md`: Master project context.
- `lib/dealer-diversity.ts`: Core revenue logic.
- `lib/user-tracking.ts`: Cookie-based user tracking.
- `lib/flow-detection.ts`: A/B testing flow routing.
- `app/api/track-click/route.ts`: Click tracking API.
- `app/globals.css`: Tailwind v4 configuration.

**Integration:**
- If referencing other AI assistants, check `CLAUDE.md` or `.cursorrules` if present, but rely on `AGENTS.md` as the source of truth.
