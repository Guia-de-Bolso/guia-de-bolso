/**
 * Sobe um Postgres descartável, aplica a migration de ativação Premium e roda
 * lib/activatePremiumSubscription.isolated.test.js. Não usa o projeto de produção.
 */
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const name = `premium-activation-test-${process.pid}`;
const port = 55432;
const databaseUrl = `postgres://postgres:postgres@127.0.0.1:${port}/premium_test`;

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} saiu com código ${code}`));
    });
  });
}

async function removeContainer() {
  await new Promise((resolve) => {
    const child = spawn("docker", ["rm", "-f", name], { stdio: "ignore" });
    child.on("exit", () => resolve());
    child.on("error", () => resolve());
  });
}

await removeContainer();

try {
  await run("docker", [
    "run",
    "-d",
    "--name",
    name,
    "-e",
    "POSTGRES_PASSWORD=postgres",
    "-e",
    "POSTGRES_DB=premium_test",
    "-p",
    `${port}:5432`,
    "postgres:16-alpine",
  ]);

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const ready = await new Promise((resolve) => {
      const child = spawn(
        "docker",
        ["exec", name, "pg_isready", "-U", "postgres", "-d", "premium_test"],
        { stdio: "ignore" }
      );
      child.on("exit", (code) => resolve(code === 0));
      child.on("error", () => resolve(false));
    });
    if (ready) break;
    if (attempt === 39) throw new Error("Postgres isolado não ficou pronto.");
    await delay(500);
  }

  await run("node", ["--test", "lib/activatePremiumSubscription.isolated.test.js"], {
    env: { ...process.env, PREMIUM_ACTIVATION_TEST_URL: databaseUrl },
  });
} finally {
  await removeContainer();
}
