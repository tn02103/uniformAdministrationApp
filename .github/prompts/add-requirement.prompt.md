---
description: "Add new or changed requirements to an already-implemented feature branch"
agent: orchestrator
argument-hint: "Issue number and brief description of the new requirement"
---

Add new requirements to an existing feature for issue #{{1}}.

Workflow type: `add-requirement`

Steps:
1. Check for an existing session file at `.github/session/{{1}}.md` — if found, load it
2. Read the current branch (`git branch --show-current`) — verify it matches `feature/#{{1}}-` or `bugfix/#{{1}}-`
3. If on the wrong branch: STOP and ask the user which branch to use
4. Delegate to the `planner` agent with workflow type `add-requirement` to read the updated issue #{{1}}, understand what's already implemented (read the existing PR if one exists), and produce an **additive** plan for only the new/changed requirements
5. Present the plan and wait for confirmation
6. Execute only the affected layers: schema (if needed) → DAL → frontend → build/lint → browser checkpoint → E2E → review → commit

**Branch stays the same** — do NOT create a new branch. The existing PR is updated, not replaced.

Use the `orchestrator` agent to coordinate this workflow.
