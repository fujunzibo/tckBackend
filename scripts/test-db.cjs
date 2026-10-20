// Migrate only the explicitly named isolated test database, then execute tests.
const { spawnSync } = require("node:child_process");
const path = require("node:path");
require("dotenv").config({ path: ".env.test", quiet: true });
const url = process.env.TEST_DATABASE_URL;
if (!url || !/^tck_wins_.*test$/.test(new URL(url).pathname.slice(1)))
  throw Error("Use a separate tck_wins_*test database");
const migration = spawnSync(
  process.execPath,
  [require.resolve("prisma/build/index.js"), "migrate", "deploy"],
  {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "inherit",
    windowsHide: true,
  },
);
if (migration.status !== 0) process.exit(migration.status ?? 1);
const test = spawnSync(
  process.execPath,
  ["--test", "--test-concurrency=1", path.join("test", "integration.test.cjs")],
  { env: process.env, stdio: "inherit", windowsHide: true },
);
process.exitCode = test.status ?? 1;
