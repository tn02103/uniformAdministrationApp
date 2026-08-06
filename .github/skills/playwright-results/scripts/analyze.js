#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function usageAndExit(msg) {
  if (msg) console.error(msg);
  console.error("Usage: node .github/skills/playwright-results/scripts/analyze.js [resultsFile]");
  process.exit(1);
}

const input = process.argv[2] || "test-results.json";
const filePath = path.resolve(process.cwd(), input);
if (!fs.existsSync(filePath)) usageAndExit(`File not found: ${filePath}`);

let data;
try {
  data = JSON.parse(fs.readFileSync(filePath, "utf8"));
} catch (err) {
  usageAndExit(`Invalid JSON in ${filePath}: ${err.message}`);
}

const rows = [];

function walkSuite(suite, parents) {
  const nextParents = suite.title ? [...parents, suite.title] : parents;
  if (Array.isArray(suite.specs)) {
    for (const spec of suite.specs) {
      const fullTitle = [...nextParents, spec.title].filter(Boolean).join(" > ");
      const file = suite.file || "unknown-file";
      if (!Array.isArray(spec.tests)) continue;
      for (const test of spec.tests) {
        const results = Array.isArray(test.results) ? test.results : [];
        const final = results.length ? results[results.length - 1] : null;
        const status = final && final.status ? final.status : "unknown";
        const errors = final && Array.isArray(final.errors) ? final.errors : [];
        rows.push({
          file,
          title: fullTitle,
          project: (final && (final.projectName || test.projectName)) || "unknown-project",
          status,
          duration: (final && typeof final.duration === "number") ? final.duration : 0,
          errors,
        });
      }
    }
  }
  if (Array.isArray(suite.suites)) {
    for (const child of suite.suites) {
      walkSuite(child, nextParents);
    }
  }
}

if (Array.isArray(data.suites)) {
  for (const suite of data.suites) {
    walkSuite(suite, []);
  }
}

if (!rows.length) {
  console.log(`No test rows found in ${filePath}`);
  process.exit(0);
}

const statusCounts = new Map();
for (const row of rows) {
  statusCounts.set(row.status, (statusCounts.get(row.status) || 0) + 1);
}

const failed = rows.filter((r) => ["failed", "timedOut", "interrupted"].includes(r.status));

console.log("Playwright JSON summary");
console.log(`File: ${filePath}`);
console.log(`Total tests: ${rows.length}`);

for (const key of ["passed", "failed", "timedOut", "interrupted", "skipped"]) {
  if (statusCounts.has(key)) {
    console.log(`${key}: ${statusCounts.get(key)}`);
  }
}

for (const [key, value] of statusCounts.entries()) {
  if (!["passed", "failed", "timedOut", "interrupted", "skipped"].includes(key)) {
    console.log(`${key}: ${value}`);
  }
}

const byFile = new Map();
for (const row of failed) {
  byFile.set(row.file, (byFile.get(row.file) || 0) + 1);
}

if (failed.length) {
  console.log("\nFailures by file:");
  for (const [file, count] of [...byFile.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`- ${file}: ${count}`);
  }

  console.log("\nTop failures (up to 10):");
  for (const item of failed.slice(0, 10)) {
    const firstError = item.errors[0];
    const message = firstError && (firstError.message || firstError.value || "(no message)");
    const excerpt = String(message).split("\n")[0];
    console.log(`- [${item.project}] ${item.title}`);
    console.log(`  status=${item.status} durationMs=${item.duration}`);
    console.log(`  file=${item.file}`);
    console.log(`  error=${excerpt}`);
  }
} else {
  console.log("\nNo failed tests found.");
}
