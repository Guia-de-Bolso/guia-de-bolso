#!/usr/bin/env node
/**
 * Cursor hook: afterFileEdit — eslint --fix no arquivo JS editado (fail-open).
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

let raw = "";
try {
  raw = readFileSync(0, "utf8");
} catch {
  process.exit(0);
}

let payload = {};
try {
  payload = raw ? JSON.parse(raw) : {};
} catch {
  process.exit(0);
}

const filePath =
  payload.file_path ??
  payload.filePath ??
  payload.path ??
  payload.file ??
  "";

if (!filePath || typeof filePath !== "string") {
  process.exit(0);
}

const ext = path.extname(filePath).toLowerCase();
if (![".js", ".mjs", ".cjs"].includes(ext)) {
  process.exit(0);
}

const normalized = filePath.replace(/^\.\//, "");
const allowedPrefix = ["app/", "lib/", "components/", "scripts/", "e2e/"];
if (!allowedPrefix.some((p) => normalized.startsWith(p))) {
  process.exit(0);
}

spawnSync("npx", ["eslint", "--fix", filePath], {
  stdio: "ignore",
  shell: false,
});

process.exit(0);
