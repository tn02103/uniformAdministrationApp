---
name: playwright-results
description: "Analyze Playwright JSON results using stable workspace scripts. Use when users ask to review e2e failures, summarize test-results.json, or debug failed Playwright runs without ad-hoc inline scripts."
user-invocable: true
---

# Playwright Results

Use this skill to analyze Playwright JSON output in a predictable way.

## When to Use
- User asks to analyze `test-results.json`
- `npm run test:e2e` fails and you need a concise summary
- You need a deterministic failure list without writing one-off terminal scripts

## Rules
- Always use the bundled scripts in this folder.
- Do not generate ad-hoc inline JSON parsing commands.
- Prefer the summary script first, then the failures-only script.

## Commands
```bash
node .github/skills/playwright-results/scripts/analyze.js
node .github/skills/playwright-results/scripts/failures.js
```

Optional custom file:
```bash
node .github/skills/playwright-results/scripts/analyze.js path/to/results.json
node .github/skills/playwright-results/scripts/failures.js path/to/results.json
```

## Outputs
- `analyze.js`: totals by status, top failure list, and file-level breakdown
- `failures.js`: only failed/timedOut/interrupted tests with error excerpts
