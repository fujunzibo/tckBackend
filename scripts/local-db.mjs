// Optional development utility. Requires npm install --prefix .local/tools embedded-postgres@18.4.0-beta.17.
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);
const moduleFile = path.join(
  root,
  ".local/tools/node_modules/embedded-postgres/dist/index.js",
);
if (!fs.existsSync(moduleFile))
  throw new Error(
    "Install the optional embedded-postgres tool under .local/tools first.",
  );
const { default: EmbeddedPostgres } = await import(
  new URL(`file:///${moduleFile.replaceAll("\\", "/")}`)
);
const directory = path.join(root, ".local/postgres");
const configFile = path.join(root, ".local/database.json");
fs.mkdirSync(path.dirname(configFile), { recursive: true });
const config = fs.existsSync(configFile)
  ? JSON.parse(fs.readFileSync(configFile, "utf8"))
  : {
      port: 55432,
      user: "wins_local",
      password: randomBytes(24).toString("hex"),
    };
if (!fs.existsSync(configFile))
  fs.writeFileSync(configFile, JSON.stringify(config), { mode: 0o600 });
const pg = new EmbeddedPostgres({
  databaseDir: directory,
  port: config.port,
  user: config.user,
  password: config.password,
  persistent: true,
  authMethod: "scram-sha-256",
  createPostgresUser: false,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  postgresFlags: ["-c", "listen_addresses=127.0.0.1"],
  onLog: () => {},
  onError: (m) => console.error(String(m)),
});
if (!fs.existsSync(path.join(directory, "PG_VERSION"))) await pg.initialise();
await pg.start();
const client = pg.getPgClient();
await client.connect();
for (const name of ["tck_wins_demo", "tck_wins_local_test"]) {
  const found = await client.query(
    "SELECT 1 FROM pg_database WHERE datname=$1",
    [name],
  );
  if (!found.rows.length) await client.query(`CREATE DATABASE "${name}"`);
}
await client.end();
const connection = `postgresql://${config.user}:${config.password}@127.0.0.1:${config.port}/`;
// Never overwrite a user's existing environment file.
if (!fs.existsSync(".env")) {
  const env = fs
    .readFileSync(".env.example", "utf8")
    .replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${connection}tck_wins_demo`)
    .replace(
      /^JWT_USER_SECRET=.*$/m,
      `JWT_USER_SECRET=${randomBytes(32).toString("hex")}`,
    )
    .replace(
      /^JWT_ADMIN_SECRET=.*$/m,
      `JWT_ADMIN_SECRET=${randomBytes(32).toString("hex")}`,
    )
    .replace(
      /^CURSOR_SECRET=.*$/m,
      `CURSOR_SECRET=${randomBytes(32).toString("hex")}`,
    )
    .replace(
      /^ADMIN_PASSWORD=.*$/m,
      `ADMIN_PASSWORD=${randomBytes(18).toString("hex")}`,
    );
  fs.writeFileSync(".env", env, { mode: 0o600 });
}
if (!fs.existsSync(".env.test"))
  fs.writeFileSync(
    ".env.test",
    `TEST_DATABASE_URL=${connection}tck_wins_local_test\n`,
    { mode: 0o600 },
  );
console.log(
  `Local PostgreSQL listening on 127.0.0.1:${config.port}. Credentials are in ignored .env/.env.test files. Keep this terminal open.`,
);
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await pg.stop();
  process.exit(0);
}
process.once("SIGINT", () => void stop());
process.once("SIGTERM", () => void stop());
