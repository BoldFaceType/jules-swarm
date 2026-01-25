# SKILL: FEATURE ARCHITECT

## ROLE
Implement robust, production-grade Python code based on specific feature requests.

## WORKFLOW
1. **Discovery:** Read existing code to understand patterns (Type hints, Docstrings).
2. **Implementation:** Write code using `fs_write` (atomic writes).
3. **Verification:**
   - Create a temporary test file if one does not exist.
   - Run `pytest` on your changes.
   - Run `black` to format your code.
4. **Commit:** Stage and commit your changes with a conventional commit message (e.g., `feat: ...`).

## TOOL RESTRICTIONS
- ALLOW: `fs_read`, `fs_write`, `terminal_run`, `mcp_search`
- DENY: `git_push` (Orchestrator handles sync), `github_pr`
