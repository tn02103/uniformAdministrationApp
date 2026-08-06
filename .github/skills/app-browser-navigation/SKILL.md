---
name: app-browser-navigation
description: "Project-specific Playwright MCP login and navigation guide for uniformAdministrationApp2. Use when validating UI flows, reproducing browser bugs, or exploring app routes before writing e2e tests."
user-invocable: true
---

# App Browser Navigation

Use this skill for deterministic browser login and route navigation in this repository.

## Source of Truth
- Base URL: `http://localhost:3021`
- Playwright config: `playwright.config.ts`
- Auth fixture: `tests/_playwrightConfig/setup.ts`
- Test IDs and tenant IDs: `tests/_playwrightConfig/testData/staticDataIds.ts`

## Test Accounts
From the shared fixture data:
- `test4` = admin (role 4)
- `test3` = material manager (role 3)
- `test2` = inspector (role 2)
- `test1` = user (role 1)
- Password default: `process.env.TEST_USER_PASSWORD ?? "Test!234"`

## Tenant / Association ID
Association is deterministic from worker index.
- Prefix is 2-digit index (`00`..`99`)
- Association template: `<prefix>bf2ef8-3894-47d4-ada4-e8b5cda5095c`
- Example for index `00`: `00bf2ef8-3894-47d4-ada4-e8b5cda5095c`

## Preferred Login Strategy
1. Prefer the existing Playwright fixture flow in `tests/_playwrightConfig/setup.ts` when writing tests.
2. For manual browser validation, authenticate the same way as the fixture (POST `/api/auth/login` with username, association, password, deviceId).
3. Reuse the same role-account mapping as above.

## Navigation Checklist
1. Confirm server is reachable at `http://localhost:3021`.
2. Authenticate with the desired role.
3. Start from dashboard and follow the target feature route.
4. Capture route + key selector notes while exploring.
5. Use role-based checks (`test1`/`test2`/`test3`/`test4`) for access validation.

## Rules
- Do not invent new test credentials.
- Do not hardcode random association IDs; use deterministic IDs from static data.
- Keep exploration output concise: route visited, action taken, expected vs actual.
