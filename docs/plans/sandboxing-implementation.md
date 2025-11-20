# Sandboxing Implementation Plan (macOS Seatbelt)

**Status:** Planned
**Target System:** macOS (using `sandbox-exec`)

## Context
To enhance security and prevent accidental modification of files outside the project directory (e.g., accidental deletion in `~/Home`), we plan to enforce strict sandboxing for the Gemini agent. This ensures the agent operates within a "safety container" restricted to the specific project path.

## Goals
1.  **Default Safety:** Enable strict sandboxing by default for all Gemini sessions.
2.  **Exception Handling:** Define clear workflows for accessing necessary external directories (e.g., `~/Downloads` for assets, `~/.gemini/` for config) without compromising overall security.

## Implementation Strategy

### 1. Enable Default Sandboxing
We will configure the Gemini CLI to enable the sandbox globally. This removes the need to manually type `--sandbox` for every command.

**Action:** Configure User Settings
*   **File:** `~/.gemini/settings.json`
*   **Configuration:**
    ```json
    {
      "tools": {
        "sandbox": true
      }
    }
    ```
*   *Alternative:* Set environment variable `export GEMINI_SANDBOX=true` in `.zshrc` / `.bash_profile`.

### 2. Handling External Access

We have identified two approaches for when the agent needs to read/write outside the `/Users/steven/dev/carzo` directory.

#### Approach A: The "One-Off" Override (Recommended)
Maintain strict security by default. When external access is specifically required (e.g., grabbing a screenshot), explicitly bypass the sandbox for that single command.

*   **Command:** `gemini --no-sandbox -p "..."`
*   **Use Case:** Copying a file from `~/Downloads`, editing a global config file.
*   **Pros:** Maximum security; requires conscious intent to break the safety seal.
*   **Cons:** Requires remembering the flag.

#### Approach B: Custom Project Profile
Create a custom Seatbelt profile that permanently allows access to specific external folders.

*   **File:** `.gemini/sandbox-macos-carzo.sb`
*   **Content Template:**
    ```scheme
    (version 1)
    (deny default)
    (allow process*)
    (allow network*)
    (import "system.sb")

    ; Allow standard project access (adjust path as needed)
    (allow file-read* file-write* (subpath "/Users/steven/dev/carzo"))
    
    ; Allow specific external paths
    (allow file-read* (subpath "/Users/steven/Downloads"))
    (allow file-read* file-write* (subpath "/Users/steven/.gemini"))
    ```
*   **Usage:** Set `export SEATBELT_PROFILE="carzo"` before running Gemini.

## Recommendation
**Adopt Approach A (One-Off Override).** 
This adheres to the principle of least privilege. The agent should rarely need to leave the project directory. When it does, the requirement to use `--no-sandbox` serves as a beneficial safety check.

## Action Items
- [ ] Create/Update `~/.gemini/settings.json` with `"sandbox": true`.
- [ ] Verify sandbox enforcement (attempt to read a file in `~/Documents` without the flag).
- [ ] Update `gemini.md` to document the `--no-sandbox` workflow for team awareness.
