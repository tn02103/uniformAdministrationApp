---
description: "Start implementing a new feature from a GitHub issue"
agent: orchestrator
argument-hint: "Issue number (e.g. 183)"
---

Start a new feature workflow for issue #{{1}}.

Workflow type: `new-feature`

Steps:
1. Check for an existing session file at `.github/session/{{1}}.md` — if found, load and resume from the last checkpoint
2. Delegate to the `planner` agent to read issue #{{1}}, update its status to "In Progress", and produce an implementation plan
3. Present the plan to the user and wait for confirmation before proceeding
4. Execute the full workflow: branch setup → schema (if needed) → DAL → frontend → build/lint → browser checkpoint → E2E → review → commit → PR

Skill expectations:
- Branch handling uses `branch-manager` flow via `setup`
- Schema/migration verification uses `db-inspector` via `prisma`
- Browser exploration and Playwright result parsing use `app-browser-navigation` + `playwright-results` via `e2e`
