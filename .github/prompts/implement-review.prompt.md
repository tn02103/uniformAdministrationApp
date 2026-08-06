---
description: "Implement changes requested in a pull request review"
agent: orchestrator
argument-hint: "PR number (e.g. 47)"
---

Implement review comments from pull request #{{1}}.

Workflow type: `implement-review`

Steps:
1. Delegate to the `planner` agent with workflow type `implement-review` to:
   - Read PR #{{1}} and all review comments using `mcp_github_pull_request_read`
   - Map each comment to the affected file, layer (dal/frontend/test), and required change
   - Produce an implementation plan scoped only to the review comments
2. Present the plan and wait for confirmation
3. Verify the correct branch is checked out (matching the PR's head branch)
4. Execute only the affected layers based on which review comments target which files
5. On completion: push to the same branch (the PR updates automatically) and reply to the review thread via `mcp_github`

**No new branch** — push to the PR's existing branch.
**No new PR** — the existing PR is updated automatically.

Skill expectations:
- Branch validation uses `branch-manager` flow via `setup`
- Schema/migration verification uses `db-inspector` via `prisma` when schema changes are required
- Browser exploration and Playwright result parsing use `app-browser-navigation` + `playwright-results` via `e2e`

Use the `orchestrator` agent to coordinate this workflow.
