# Development Workflow — Tickets, Branches, PRs

This workflow guides the agent through feature implementation and bug fixes from ticket to PR merge.

## Step 1: Ticket Management
When given a feature or bug to implement:

1. **Check if ticket exists**
   - Use `gh issue view <number>` or `gh issue list` to find related issues
   - Search by title/label if no issue number provided

2. **Create ticket if missing**
   - Use `gh issue create --title "..." --body "..." --label "bug"` or `--label "feature"`
   - Record the ticket number for step 2

3. **Update ticket status in project**
   - Use GitHub's project API to update the ticket status to "In Progress" in the "UnifrmAdmin-App" project
   - Command: `gh api graphql -f query='mutation { updateProjectV2ItemFieldValue(input: {projectId: "<PROJECT_ID>" itemId: "<ITEM_ID>" fieldId: "<STATUS_FIELD_ID>" value: {singleSelectOptionId: "<IN_PROGRESS_ID>"}}) { projectV2Item { id } } }'`
   - Alternatively, if the project has automation rules enabled, the agent may manually move the issue in the GUI or leave a comment to trigger automation
   - If this proves difficult to automate, the user can manually update the status in the project board

## Step 2: Branch Creation
Create and check out a new branch following the naming pattern: `(feature|bugfix)/#[number]-[slug]`

**Base branch:**
- Default: `develop`
- If ticket is part of an epic: use the epic's feature branch as base and target for merge

Examples:
```
feature/#148-user-authentication     (based on develop)
bugfix/#493-fix-timeout-validation   (based on develop)
feature/#38-authentifizierung        (based on develop or epic branch if applicable)
```

Use Git commands:
```bash
# Check current develop is up-to-date
git fetch origin develop

# Create from develop
git checkout -b feature/#148-user-authentication origin/develop

# Or from epic branch if applicable
git checkout -b feature/#148-user-authentication origin/feature/epic-name
```

## Step 3: Code Analysis & Planning
Before implementing:

1. **Read relevant files** to understand the current codebase, patterns, and architecture
2. **Create a local implementation plan** in the agent-memory directory (`.claude/projects/[project]/memory/`)
   - File name: `[ticket-number]-plan.md` (e.g., `148-plan.md`)
   - Include:
     - **Objective**: What you're building/fixing
     - **Scope**: Files that will be modified/created
     - **Architecture**: Key decisions (DAL vs. action, new schema, etc.)
     - **Steps**: Numbered breakdown of implementation
     - **Testing strategy**: What tests are needed (unit, integration, E2E)
     - **Risks**: Edge cases, permission checks, multi-tenancy concerns

3. **Use `EnterPlanMode`** if the task is non-trivial (multiple files, architectural decisions, unclear scope)
   - This creates a formal plan file that the user can review
   - Include the implementation steps, dependencies, and trade-offs

## Step 4: Ask Clarifying Questions
If after analysis you have unanswered questions about:
- Expected user behaviour
- Edge cases or error handling
- Which files/patterns to follow
- Performance / scalability concerns

Use `AskUserQuestion` to resolve ambiguity before proceeding to implementation.

## Step 5: Implementation & Incremental Commits
Implement the feature/fix in logical chunks, committing after each significant step:

- **Commit 1**: DAL changes (schema if needed, database functions)
- **Commit 2**: Server Actions / API layer
- **Commit 3**: Frontend components / UI
- **Commit 4**: Tests (unit + integration + E2E as applicable)

Each commit message must start with the ticket reference, then describe what was done:
Format: `(feat|bugfix):#[number] add/fix/update [description]`

Examples:
```
(feat):#148 add user authentication DAL functions
(bugfix):#493 fix token comparison timing vulnerability
(feat):#38 add authentifizierung form component
```

Full example commit:
```bash
git commit -m "(feat):#148 add authentication DAL functions

Implements getUser, createSession, validateToken with proper org scoping
and timing-safe comparison for token verification.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

## Step 6: Run All Tests
Before any push:
```bash
npm run test:dal:unit         # Should pass
npm run test:dal:integration  # Should pass
npm run test:components       # Should pass
npm run test:e2e              # Should pass (or note if skipped)
npm run lint                  # Should pass
npm run build                 # Should succeed
```

If tests fail, fix the issue and commit again. Do not push with failing tests.

## Step 7: Final Commit
After all tests pass, create a final commit if any changes were made during testing:
```bash
git commit -m "(fix):#[number] test fixes and cleanup"
```

If no changes during testing, skip this step.

## Step 8: Ask User to Publish Branch
Before pushing, ask the user for confirmation:
> Ready to publish the branch to remote? This will push all commits and allow creating a PR.

Once confirmed, push:
```bash
git push -u origin feature/#148-user-authentication
```

## Step 9: Create Pull Request
Link the PR to the ticket using the ticket number in the title and body:
```bash
gh pr create \
  --title "(feat):#148 Add user authentication" \
  --body "$(cat <<'EOF'
Closes #148

## Summary
Implements user login flow with JWT tokens and session management.

## Changes
- DAL: User authentication functions
- API: Login and logout endpoints
- Frontend: Login form component

## Test Plan
- [x] Unit tests for token validation
- [x] Integration tests for DB operations
- [x] Component test for login form
- [x] E2E test for full login flow

EOF
)" \
  --label "feature" \
  --label "type/implementation"
```

Verify the PR appears at `https://github.com/[owner]/[repo]/pulls/[number]`.

## Step 10: Update Ticket Status
After PR is created:
- The PR is now linked via the "Closes #[number]" in the body
- Update the ticket status in the "UnifrmAdmin-App" project to "In Review"
- Use the same GitHub project API approach as Step 1.3 to change status, or manually update if API proves difficult
- The PR will automatically show as linked in the ticket

## Key Rules
- **Always ask before pushing** — branch pushes and PRs are visible to others
- **Never force-push** to main/master — only if explicitly requested
- **Never merge directly to main, develop, or release** — only via approved PRs
- **Base branches**: default to `develop`, or epic branch if ticket is part of an epic
- **Commit message format**: `(feat|bugfix):#[number] description` — always include ticket reference
- **Keep commits atomic** — one logical change per commit
- **Squash commits** only if the user explicitly requests it (e.g., "create a single commit")
- **Test before push** — no red tests reach the remote
- **PR title format**: match commit format `(feat|bugfix):#[number] description`
- **Link tickets in PRs** — use `Closes #[number]` in PR body for automatic linking

## When Things Go Wrong

**Tests fail locally:**
- Do not push
- Fix the issue in a new commit (do not amend unless still unpublished)
- Run tests again and verify all pass
- Then proceed to step 8

**Merge conflict on develop:**
- Rebase on latest develop: `git rebase origin/develop`
- Resolve conflicts manually
- Push again (only on unpublished feature branches)

**NEVER merge directly to main, develop, or release:**
- All merges must go through Pull Requests
- Only merge via PR after approval
- If a merge target is protected, follow the PR process strictly

**Pre-commit hook fails:**
- Read the error message carefully
- Fix the issue (e.g., ESLint, formatting)
- Create a NEW commit (do not amend the previous one)
- Do not skip the hook with `--no-verify`
