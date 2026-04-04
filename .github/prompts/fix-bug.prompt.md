---
description: "Fix a bug from a GitHub issue number"
agent: orchestrator
argument-hint: "Issue number (e.g. 183)"
---

Start a bug fix workflow for issue #{{1}}.

Workflow type: `fix-bug`

Steps:
1. Check for an existing session file at `.github/session/{{1}}.md` — if found, load and resume from the last checkpoint
2. Delegate to the `planner` agent to read issue #{{1}}, update its status to "In Progress", and produce an implementation plan. The planner should set `schema_changes: no` unless the issue clearly requires a schema change.
3. Present the plan to the user and wait for confirmation before proceeding
4. Execute the workflow: branch setup → schema (only if plan requires) → DAL → frontend → build/lint → browser checkpoint → E2E → review → commit → PR

Use the `orchestrator` agent to coordinate this workflow.
