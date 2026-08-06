---
name: branch-manager
description: "Standalone branch selection and creation workflow for this repository. Use when preparing or validating feature/bugfix branches without running full environment setup."
user-invocable: true
---

# Branch Manager

Use this skill to manage branches independently from the full setup flow.

## Branch Conventions
- Feature: `feature/#<ticket>-<slug>`
- Bugfix: `bugfix/#<ticket>-<slug>`
- Epic base branch may be used when provided

## Inputs
- `ticket_number`
- `workflow_type`: `new-feature` | `fix-bug` | `add-requirement` | `implement-review`
- `branch_name`
- `base_branch` (default `develop`)

## Commands
For `new-feature` and `fix-bug`:
```bash
git fetch origin
git branch -a | grep "<branch_name>" || true
```
- If branch exists locally: `git checkout <branch_name>`
- If branch exists remotely only: `git checkout -b <branch_name> origin/<branch_name>`
- If branch does not exist: `git checkout -b <branch_name> origin/<base_branch>`

For `add-requirement` and `implement-review`:
```bash
git branch --show-current
```
- Must match `feature/#<ticket>-` or `bugfix/#<ticket>-`
- If mismatch: stop and ask user to switch explicitly

## Output Contract
```yaml
BRANCH_RESULT:
  status: pass | fail
  branch: <checked out branch>
  created: yes | no
  failure_details: <if status=fail>
```

## Rules
- Do not run dependency install or database reset in this skill.
- Do not create new branch for add-requirement/implement-review.
- Prefer non-destructive git commands.
