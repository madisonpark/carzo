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

3.  **ALWAYS respond to PR feedback with comments**
    - When addressing feedback from gemini-code-assist or claude (AI reviewers)
    - Add PR comment tagging the bot: `@gemini-code-assist` or `@claude`
    - Describe what was changed and why
    - Example: `@gemini-code-assist Fixed the type safety issue by adding explicit types to the function parameters as suggested.`
    - If feedback NOT addressed, explain why: `@claude I did not implement X because...`

4.  **Commit Messages**
    - Format: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
    - Be descriptive but concise.

5.  **Use GitHub CLI for all GitHub operations**
    - Create PRs: `gh pr create --fill`
    - Comment on PRs: `gh pr comment PR_NUMBER --body "..."`
    - View PRs: `gh pr view PR_NUMBER`
    - Merge PRs: `gh pr merge PR_NUMBER --squash` (only after approval)
    - **DO NOT ask user to perform GitHub operations manually** when `gh` CLI can do it

6.  **Pushing**
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
- **Respond to Feedback**: See item #3 above.
- **NEVER** merge without an explicit "merge" command from the user.

---

## Testing Requirements (CRITICAL)

**⚠️ Prioritize testing, especially for revenue-critical code**

**Revenue-Critical Files Require 95% Coverage:**
- `lib/dealer-diversity.ts` - Round-robin dealer algorithm (THE MONEY ALGORITHM)
- `lib/flow-detection.ts` - A/B testing flow routing
- `lib/user-tracking.ts` - Cookie-based user tracking
- `app/api/track-click/route.ts` - Click tracking API

**Test Standards & Structure:**
- **Location**: Colocate tests in `__tests__/` directories (e.g., `lib/__tests__/utils.test.ts`).
- **Framework**: Vitest v4 with `@testing-library/react`.
- **Determinism**: Tests must be deterministic (mock time/randomness).
- **Commands**:
    - `npm test`: Run all tests.
    - `npm run test:watch`: Watch mode.
    - `npm run test:coverage`: Check coverage thresholds.

**Deferral Policy:**
- Tests are required for new features and bug fixes.
- **Exception**: Tests may be deferred for rapid prototyping if explicitly noted in the PR description.
- **NEVER** defer tests for revenue-critical code.

---

## Security Requirements

**Always check for:**
- **SQL injection**: Use parameterized queries.
- **XSS**: Sanitize user inputs.
- **Secrets**: Never commit secrets (use `.env.local`, gitignored).
- **Rate limiting**: All POST endpoints must call `checkMultipleRateLimits()`.

## Mobile-First Development

**Always consider mobile:**
- **Base styles**: Mobile first (min-width: 320px).
- **Breakpoints**: Use `lg:` for desktop (1024px).
- **Touch targets**: Minimum 40x40px (WCAG Level AAA).

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
