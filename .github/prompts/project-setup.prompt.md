---
description: "Set up the local development environment for a ticket: branch checkout/creation, npm install, prisma generate, migrate reset, seed."
agent: setup
argument-hint: "Issue number (e.g. 183)"
---

Set up local development environment for ticket #{{1}}.

- workflow_type: determine from context (default to `new-feature` if unknown)
- base_branch: `develop`
- Derive the branch name from the ticket number and title

Run all setup steps: branch checkout/creation, npm install, prisma generate, migrate reset (localhost only), seed.

If user only asks for branch selection/creation, run branch-only handling via the `branch-manager` skill path and skip install/reset steps.
