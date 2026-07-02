#!/usr/bin/env node
/**
 * Build estático do app para bundle local no Capacitor.
 * - Remove rotas server-only (API, admin, marketing) durante o export
 * - Gera `out/` com hostname app.guiadebolso.app (via capacitor.config.ts)
 * - APIs continuam em produção (NEXT_PUBLIC_CAPACITOR_API_ORIGIN)
 */
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const stashRoot = path.join(root, ".capacitor-stash");

/** Caminhos relativos à raiz movidos temporariamente para permitir `output: export`. */
const STASH_PATHS = [
  "app/api",
  "app/admin",
  "app/guia",
  "app/landing",
  "app/para-negocios",
  "app/imbituba",
  "app/baixar",
  "app/q",
  "app/opengraph-image.js",
  "app/sitemap.js",
  "app/robots.js",
  "app/auth/callback",
  "middleware.js",
];

function log(message) {
  console.log(`[capacitor-build] ${message}`);
}

function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...env },
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} falhou (código ${result.status})`);
  }
}

function stashPaths() {
  mkdirSync(stashRoot, { recursive: true });

  for (const relativePath of STASH_PATHS) {
    const source = path.join(root, relativePath);
    if (!existsSync(source)) continue;

    const target = path.join(stashRoot, relativePath);
    mkdirSync(path.dirname(target), { recursive: true });

    if (existsSync(target)) {
      rmSync(target, { recursive: true, force: true });
    }

    renameSync(source, target);
    log(`stash: ${relativePath}`);
  }
}

function restorePaths() {
  for (const relativePath of STASH_PATHS) {
    const source = path.join(stashRoot, relativePath);
    const target = path.join(root, relativePath);

    if (!existsSync(source)) continue;

    if (existsSync(target)) {
      rmSync(target, { recursive: true, force: true });
    }

    mkdirSync(path.dirname(target), { recursive: true });
    renameSync(source, target);
    log(`restore: ${relativePath}`);
  }

  if (existsSync(stashRoot)) {
    rmSync(stashRoot, { recursive: true, force: true });
  }
}

function main() {
  const apiOrigin =
    process.env.NEXT_PUBLIC_CAPACITOR_API_ORIGIN?.trim() ||
    "https://app.guiadebolso.app";

  log("Preparando export estático para Capacitor…");
  stashPaths();

  try {
    run("node", ["scripts/copy-ffmpeg-core.mjs"]);
    run("npx", ["next", "build"], {
      CAPACITOR_BUILD: "1",
      NEXT_PUBLIC_CAPACITOR_API_ORIGIN: apiOrigin,
    });

    if (!existsSync(path.join(root, "out", "index.html"))) {
      throw new Error("Export não gerou out/index.html");
    }

    log(`Bundle em out/ (API remota: ${apiOrigin})`);
    run("npx", ["cap", "sync"]);
    log("cap sync concluído — abra ios/ ou android/ para gerar o binário nativo.");
  } finally {
    restorePaths();
  }
}

main();
