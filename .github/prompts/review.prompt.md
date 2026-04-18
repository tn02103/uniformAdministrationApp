---
description: "Review the current branch changes for architectural compliance, security, test coverage, and PR readiness"
agent: reviewer
---

Review all changes on the current branch against the base branch.

Steps:
1. Identify the base branch (usually `develop`): `git merge-base HEAD origin/develop`
2. List all files changed since that point
3. Run the full review checklist against those files
4. Return the REVIEW_RESULT with PASS or FAIL and specific file:line issues

This is a standalone review — no automatic fix cycle. Issues are reported directly to the user.
