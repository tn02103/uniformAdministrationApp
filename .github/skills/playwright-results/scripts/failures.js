#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function usageAndExit(msg) {
  if (msg) console.error(msg);
  console.error("Usage: node .github/skills/playwright-results/scripts/failures.js [resultsFile]");
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

const failures = [];

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
        if (!final) continue;
        if (!["failed", "timedOut", "interrupted"].includes(final.status)) continue;

        const errors = Array.isArray(final.errors) ? final.errors : [];
        const firstError = errors[0] || {};
        const message = firstError.message || firstError.value || "(no message)";
        failures.push({
          file,
          title: fullTitle,
          project: final.projectName || test.projectName || "unknown-project",
          status: final.status,
          duration: typeof final.duration === "number" ? final.duration : 0,
          error: String(message),
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

if (!failures.length) {
  console.log(`No failures found in ${filePath}`);
  process.exit(0);
}

console.log(`Failures in ${filePath}: ${failures.length}`);
for (const item of failures) {
  console.log("---");
  console.log(`[${item.project}] ${item.title}`);
  console.log(`status=${item.status} durationMs=${item.duration}`);
  console.log(`file=${item.file}`);
  console.log(`error=${item.error.split("\n")[0]}`);
}
