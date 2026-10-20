// Explicitly targets a separate test database. No truncation, no production data.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID, randomBytes } = require("node:crypto");
const { spawn } = require("node:child_process");
const path = require("node:path");
require("reflect-metadata");
const url = process.env.TEST_DATABASE_URL;
if (!url || !/^tck_wins_.*test$/.test(new URL(url).pathname.slice(1)))
  throw new Error(
    "TEST_DATABASE_URL must point to a separate tck_wins_*test database",
  );
process.env.DATABASE_URL = url;
process.env.JWT_USER_SECRET = randomBytes(32).toString("hex");
process.env.JWT_ADMIN_SECRET = randomBytes(32).toString("hex");
process.env.CURSOR_SECRET = randomBytes(32).toString("hex");
process.env.PLATFORM_MODE = "demo";
process.env.MOCK_AUTH_ENABLED = "true";
process.env.REAL_MONEY_ENABLED = "false";
process.env.CARD_CHECKOUT_ENABLED = "false";
process.env.NOOVA_ENABLED = "false";
process.env.WORKER_ENABLED = "true";
process.env.WORKER_INTERVAL_MS = "100";
const { createApp } = require("../dist/bootstrap");
const { PrismaService } = require("../dist/prisma/prisma.service");
const { LedgerService } = require("../dist/assets/ledger.service");
const { WorkerService } = require("../dist/jobs/worker.service");
const { seed } = require("../dist/seed.service");
const { passwordHash } = require("../dist/common/util");
let app, db, worker, base, admin, alice, bob;
const password = randomBytes(18).toString("hex"),
  username = `test_${randomUUID()}`;
async function api(route, { token, method = "GET", body, key } = {}) {
  const response = await fetch(base + route, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(method !== "GET" ? { "Idempotency-Key": key ?? randomUUID() } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  return { ...data, status: response.status };
}
async function ok(route, options) {
  const result = await api(route, options);
  assert.equal(result.success, true, JSON.stringify(result));
  return result.data;
}
const write = (token, body = {}, key) => ({ token, body, key, method: "POST" });
async function login(name) {
  return ok("/auth/demo-login", write(undefined, { nickname: name }));
}
async function advanceJobs() {
  await db.job.updateMany({
    where: { status: "pending" },
    data: { runAt: new Date(0) },
  });
  for (let i = 0; i < 100; i++) {
    if (!(await worker.tick())) break;
  }
}
before(async () => {
  app = await createApp();
  app.useLogger(false);
  await app.listen(0, "127.0.0.1");
  base = `${await app.getUrl()}/api/v1`;
  db = app.get(PrismaService);
  worker = app.get(WorkerService);
  await seed(db, app.get(LedgerService), username, password);
  admin = await ok(
    "/admin/auth/login",
    write(undefined, { username, password }),
  );
  alice = await login("Alice");
  bob = await login("Bob");
});
after(async () => {
  if (app) await app.close();
});
test("sessions isolate identities, reject forged recovery and separate admin tokens", async () => {
  assert.notEqual(alice.user.id, bob.user.id);
  assert.equal(alice.user.walletAddress, "");
  assert.equal(
    (await api("/admin/users", { token: alice.accessToken })).status,
    401,
  );
  assert.equal(
    (await api("/users/me", { token: admin.accessToken })).status,
    401,
  );
  assert.equal(
    (
      await api(
        "/auth/demo-login",
        write(undefined, {
          nickname: "Intruder",
          resumeSecret: "f".repeat(64),
        }),
      )
    ).status,
    401,
  );
  const restored = await ok(
    "/auth/demo-login",
    write(undefined, { nickname: "ignored", resumeSecret: alice.resumeSecret }),
  );
  assert.equal(restored.user.id, alice.user.id);
  assert.equal(
    (
      await api(
        "/auth/login",
        write(undefined, { signature: "0xmock-invalid" }),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await api(
        "/fighters",
        write(alice.accessToken, {
          name: "Invalid",
          style: "striker",
          userId: bob.user.id,
        }),
      )
    ).status,
    400,
  );
});
test("concurrent quote consumption creates one debit and one immutable result", async () => {
  const quote = (
    await ok(
      "/games/game_coin_flip/quotes",
      write(alice.accessToken, { choice: "heads" }),
    )
  ).quote;
  const rounds = await Promise.all(
    Array.from({ length: 4 }, () =>
      ok(
        "/games/game_coin_flip/sessions",
        write(alice.accessToken, { quoteId: quote.id }),
      ),
    ),
  );
  assert.equal(new Set(rounds.map((r) => r.session.id)).size, 1);
  const id = rounds[0].session.id;
  assert.equal(rounds[0].session.outcome, "");
  const assets = (await ok("/assets/me", { token: alice.accessToken })).items;
  const ssc = assets.find((a) => a.assetId === "SSC");
  assert.equal(ssc.lockedAtomic, quote.amountAtomic);
  assert.equal(
    ssc.availableAtomic,
    (1000n - BigInt(quote.amountAtomic)).toString(),
  );
  assert.equal(
    (await api(`/game-sessions/${id}`, { token: bob.accessToken })).status,
    404,
  );
  await advanceJobs();
  const settled = (
    await ok(`/game-sessions/${id}`, { token: alice.accessToken })
  ).session;
  assert.equal(settled.status, "settled");
  const count = await db.ledgerTransaction.count({
    where: { referenceId: id },
  });
  await worker.tick();
  assert.equal(
    await db.ledgerTransaction.count({ where: { referenceId: id } }),
    count,
  );
  alice.roundId = id;
});
test("idempotency rejects altered input and maintains the original response", async () => {
  const key = randomUUID(),
    first = await ok(
      "/games/game_coin_flip/quotes",
      write(alice.accessToken, { choice: "heads" }, key),
    );
  const again = await ok(
    "/games/game_coin_flip/quotes",
    write(alice.accessToken, { choice: "heads" }, key),
  );
  assert.equal(first.quote.id, again.quote.id);
  assert.equal(
    (
      await api(
        "/games/game_coin_flip/quotes",
        write(alice.accessToken, { choice: "tails" }, key),
      )
    ).error.code,
    "IDEMPOTENCY_CONFLICT",
  );
  await db.gameQuote.update({
    where: { id: first.quote.id },
    data: { expiresAt: new Date(0) },
  });
  assert.equal(
    (
      await api(
        "/games/game_coin_flip/sessions",
        write(alice.accessToken, { quoteId: first.quote.id }),
      )
    ).error.code,
    "QUOTE_EXPIRED",
  );
});
test("task review preserves rejection history, version and one reward across both claim routes", async () => {
  assert.equal(
    (
      await api(
        "/quests/first-game/submit",
        write(bob.accessToken, { proof: alice.roundId }),
      )
    ).status,
    422,
  );
  let record = (
    await ok(
      "/quests/first-game/submit",
      write(alice.accessToken, { proof: alice.roundId }),
    )
  ).record;
  assert.equal(
    (
      await api(
        `/admin/quest-records/${record.id}/review`,
        write(admin.accessToken, { version: record.version, action: "reject" }),
      )
    ).status,
    422,
  );
  record = (
    await ok(
      `/admin/quest-records/${record.id}/review`,
      write(admin.accessToken, {
        version: record.version,
        action: "reject",
        reason: "Please resubmit proof",
      }),
    )
  ).record;
  record = (
    await ok(
      "/quests/first-game/submit",
      write(alice.accessToken, { proof: alice.roundId }),
    )
  ).record;
  assert.equal(record.history.length, 2);
  assert.equal(
    (
      await api(
        `/admin/quest-records/${record.id}/review`,
        write(admin.accessToken, { version: 1, action: "approve" }),
      )
    ).status,
    409,
  );
  record = (
    await ok(
      `/admin/quest-records/${record.id}/review`,
      write(admin.accessToken, { version: record.version, action: "approve" }),
    )
  ).record;
  await Promise.all([
    ok("/quests/first-game/claim", write(alice.accessToken)),
    ok(`/rewards/${record.rewardGrantId}/claim`, write(alice.accessToken)),
  ]);
  assert.equal(
    (await ok("/users/me", { token: alice.accessToken })).user.pointsExact,
    "100",
  );
  assert.equal(
    await db.ledgerTransaction.count({
      where: { businessKey: `reward:issue:${record.rewardGrantId}` },
    }),
    1,
  );
});
test("reward budget exhaustion rolls back approval until authorized budget allocation", async () => {
  const quest = (
    await ok(
      "/admin/quests",
      write(admin.accessToken, {
        title: "Budget Test",
        description: "A manual budget test quest",
        type: "social",
        reviewMode: "manual",
        rewardAmount: "30",
        status: "published",
        startTime: "2026-01-01T00:00:00Z",
        endTime: "2099-12-31T00:00:00Z",
      }),
    )
  ).quest;
  let record = (
    await ok(
      `/quests/${quest.id}/submit`,
      write(bob.accessToken, { proof: "A sufficient proof" }),
    )
  ).record;
  const result = await api(
    `/admin/quest-records/${record.id}/review`,
    write(admin.accessToken, { version: record.version, action: "approve" }),
  );
  assert.equal(result.error.code, "BUDGET_EXHAUSTED");
  assert.equal(
    (await db.questRecord.findUnique({ where: { id: record.id } })).status,
    "pending_review",
  );
  await ok(
    `/admin/quests/${quest.id}/budget`,
    write(admin.accessToken, { amountAtomic: "30", reason: "Test allocation" }),
  );
  record = (
    await ok(
      `/admin/quest-records/${record.id}/review`,
      write(admin.accessToken, { version: record.version, action: "approve" }),
    )
  ).record;
  assert.equal(record.status, "completed");
});
test("failed fighter generation refunds one ticket; retry and active fight exclusion", async () => {
  let fighter = (
    await ok(
      "/fighters",
      write(alice.accessToken, {
        name: "Aurora",
        style: "striker",
        simulateFailure: true,
      }),
    )
  ).fighter;
  await advanceJobs();
  fighter = (await ok(`/fighters/${fighter.id}`, { token: alice.accessToken }))
    .fighter;
  assert.equal(fighter.status, "failed");
  assert.equal(fighter.refunded, true);
  assert.equal(
    (await ok("/tickets/me", { token: alice.accessToken })).balance
      .availableAtomic,
    "3",
  );
  await ok(`/fighters/${fighter.id}/retry`, write(alice.accessToken));
  await advanceJobs();
  assert.equal(
    (await ok(`/fighters/${fighter.id}`, { token: alice.accessToken })).fighter
      .status,
    "ready",
  );
  const results = await Promise.all([
    api("/fights/queue", write(alice.accessToken, { fighterId: fighter.id })),
    api("/fights/queue", write(alice.accessToken, { fighterId: fighter.id })),
  ]);
  assert.equal(results.filter((r) => r.success).length, 1);
  assert.equal(results.find((r) => !r.success).error.code, "FIGHTER_BUSY");
  await advanceJobs();
  assert.equal(
    (
      await ok(`/fights/${results.find((r) => r.success).data.fight.id}`, {
        token: alice.accessToken,
      })
    ).fight.status,
    "settled",
  );
  assert.equal(
    (await ok("/tickets/me", { token: alice.accessToken })).balance
      .availableAtomic,
    "2",
  );
});
test("notifications use ownership and a snapshot; cursor cannot cross accounts", async () => {
  await worker.publish();
  const first = await ok("/notifications?pageSize=1", {
    token: alice.accessToken,
  });
  assert.ok(first.items.length);
  assert.ok(first.nextCursor);
  const later = await db.notification.create({
    data: {
      userId: alice.user.id,
      eventKey: randomUUID(),
      type: "system",
      title: { zh: "新消息" },
      body: { zh: "新消息" },
      href: "/dashboard",
    },
  });
  await ok(
    "/notifications/read-all",
    write(alice.accessToken, { ids: first.snapshotIds }),
  );
  assert.equal(
    (await db.notification.findUnique({ where: { id: later.id } })).readAt,
    null,
  );
  assert.equal(
    (
      await api(`/notifications/${later.id}/read`, {
        ...write(bob.accessToken),
        method: "PATCH",
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await api(
        `/notifications?pageSize=1&cursor=${encodeURIComponent(first.nextCursor)}`,
        { token: bob.accessToken },
      )
    ).status,
    409,
  );
});
test("RBAC and project scope reject both reads and writes outside allowed resources", async () => {
  const name = `project_${randomUUID()}`;
  await db.admin.create({
    data: {
      username: name,
      passwordHash: passwordHash(password),
      role: "project_operator",
      entryIds: ["partner-lab"],
    },
  });
  const project = await ok(
    "/admin/auth/login",
    write(undefined, { username: name, password }),
  );
  assert.equal(
    (await api("/admin/users", { token: project.accessToken })).status,
    403,
  );
  assert.equal(
    (await api("/admin/fighters", { token: project.accessToken })).status,
    403,
  );
  const games = await ok("/admin/games", { token: project.accessToken });
  assert.ok(games.items.every((g) => g.entryId === "partner-lab"));
  const q = await db.quest.findUnique({ where: { id: "first-game" } });
  assert.equal(
    (
      await api("/admin/quests/first-game/status", {
        ...write(project.accessToken, {
          version: q.version,
          status: "offline",
        }),
        method: "PATCH",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await api(
        "/admin/points/adjust",
        write(project.accessToken, {
          userId: alice.user.id,
          changeAmount: "1",
          reason: "Not authorized",
        }),
      )
    ).status,
    403,
  );
});
test("database rejects mutable journals, unbalanced transfers and negative balances", async () => {
  const count = await db.ledgerTransaction.count();
  await assert.rejects(
    db.ledgerTransaction.create({
      data: {
        businessKey: randomUUID(),
        reason: "invalid",
        referenceId: "invalid",
      },
    }),
  );
  assert.equal(await db.ledgerTransaction.count(), count);
  const entry = await db.ledgerEntry.findFirst();
  await assert.rejects(
    db.ledgerEntry.update({
      where: { id: entry.id },
      data: { reason: "overwrite" },
    }),
  );
  await assert.rejects(
    db.account.update({
      where: { id: `user:${alice.user.id}:SSC` },
      data: { balance: "-1" },
    }),
  );
  assert.equal(
    (
      await api(
        "/admin/points/adjust",
        write(admin.accessToken, {
          userId: alice.user.id,
          changeAmount: "-1000000",
          reason: "Would overdraw",
        }),
      )
    ).error.code,
    "INSUFFICIENT_BALANCE",
  );
  const mismatches = await db.$queryRawUnsafe(
    'SELECT a.id FROM "Account" a LEFT JOIN "LedgerEntry" e ON e."accountId"=a.id GROUP BY a.id HAVING a.balance <> COALESCE(sum(e.amount),0)',
  );
  assert.equal(mismatches.length, 0);
  const unbalanced = await db.$queryRawUnsafe(
    'SELECT "transactionId" FROM "LedgerEntry" GROUP BY "transactionId" HAVING sum(amount) <> 0 OR count(DISTINCT "assetId") <> 1',
  );
  assert.equal(unbalanced.length, 0);
});
test("persisted jobs recover after a dead lease and a new independent Worker process", async () => {
  const quote = (
    await ok(
      "/games/game_coin_flip/quotes",
      write(bob.accessToken, { choice: "tails" }),
    )
  ).quote;
  const session = (
    await ok(
      "/games/game_coin_flip/sessions",
      write(bob.accessToken, { quoteId: quote.id }),
    )
  ).session;
  await db.job.update({
    where: { businessKey: `game:${session.id}` },
    data: {
      status: "running",
      leaseOwner: "dead-process",
      leaseUntil: new Date(0),
      runAt: new Date(0),
    },
  });
  const child = spawn(
    process.execPath,
    [path.join(__dirname, "../dist/worker.js")],
    { env: process.env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true },
  );
  let output = "";
  child.stdout.on("data", (x) => (output += x));
  child.stderr.on("data", (x) => (output += x));
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      const state = await db.gameSession.findUnique({
        where: { id: session.id },
      });
      if (state.status === "settled") {
        ready = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    assert.ok(ready, output);
    const saved = await db.gameSession.findUnique({
      where: { id: session.id },
    });
    assert.equal(saved.status, "settled");
  } finally {
    child.kill();
    await new Promise((resolve) => child.once("exit", resolve));
  }
});
test("exhausted worker leases refund the round once and keep a failed record", async () => {
  const balances = async () =>
    (await ok("/assets/me", { token: alice.accessToken })).items.find(
      (a) => a.assetId === "SSC",
    );
  const before = await balances();
  const { quote } = await ok(
    "/games/game_coin_flip/quotes",
    write(alice.accessToken, { choice: "heads" }),
  );
  const { session } = await ok(
    "/games/game_coin_flip/sessions",
    write(alice.accessToken, { quoteId: quote.id }),
  );
  await db.job.update({
    where: { businessKey: `game:${session.id}` },
    data: {
      status: "running",
      attempt: 5,
      leaseOwner: "crashed-before-compensation",
      leaseUntil: new Date(0),
      runAt: new Date(0),
    },
  });
  await worker.tick();
  assert.equal(
    (await db.gameSession.findUniqueOrThrow({ where: { id: session.id } }))
      .status,
    "failed",
  );
  assert.equal(
    (
      await db.job.findUniqueOrThrow({
        where: { businessKey: `game:${session.id}` },
      })
    ).status,
    "dead",
  );
  assert.equal((await balances()).availableAtomic, before.availableAtomic);
  assert.equal((await balances()).lockedAtomic, "0");
  await worker.tick();
  assert.equal(
    await db.ledgerTransaction.count({
      where: { businessKey: `game:consume:${session.id}` },
    }),
    1,
  );
});
test("frontend query projections and budget views return valid database shapes", async () => {
  for (const route of [
    "/public/config",
    "/public/home-summary",
    "/public/site-content",
    "/public/enums",
    "/games?status=available",
    "/live-wins",
    "/quests",
    "/dashboard/me",
    "/assets/me/ledger",
    "/tickets/me",
    "/game-sessions/me",
    "/fighters/me",
    "/fights/me",
    "/rewards/me",
    "/users/me/point-logs",
    "/users/me/quest-records",
    "/invitations/me",
    "/membership/levels",
    "/membership/me",
    "/holdings/me",
  ])
    await ok(route, { token: alice.accessToken });
  for (const route of [
    "/admin/overview",
    "/admin/users",
    `/admin/users/${alice.user.id}`,
    "/admin/quests",
    "/admin/quest-templates",
    "/admin/quest-records",
    "/admin/points/logs",
    "/admin/settings",
    "/admin/games",
    "/admin/game-sessions",
    "/admin/fighters",
    "/admin/fights",
    "/admin/rewards/batches",
    "/admin/audit-logs",
    "/admin/invitations",
    "/admin/leaderboards",
    "/admin/import-batches",
    "/admin/legacy-identities",
    "/admin/jobs",
    "/admin/outbox",
  ])
    await ok(route, { token: admin.accessToken });
  const quests = await ok("/admin/quests", { token: admin.accessToken });
  const budget = await ok(`/admin/quests/${quests.items[0].id}/budget`, {
    token: admin.accessToken,
  });
  assert.match(budget.availableAtomic, /^\d+$/);
  await ok(
    "/admin/points/adjust",
    write(admin.accessToken, {
      userId: bob.user.id,
      changeAmount: "9",
      reason: "Numeric ranking regression",
    }),
  );
  const ranking = await ok("/leaderboards/points?pageSize=100");
  for (let i = 1; i < ranking.items.length; i++)
    assert.ok(
      BigInt(ranking.items[i - 1].value) >= BigInt(ranking.items[i].value),
    );
  assert.equal((await api("/quests?pageSize=101")).status, 400);
  const invalid = await fetch(`${base}/auth/demo-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).error.code, "VALIDATION_ERROR");
});
test("logout revokes sessions and freezing invalidates all existing user tokens", async () => {
  const restored = await ok(
    "/auth/demo-login",
    write(undefined, { nickname: "Bob", resumeSecret: bob.resumeSecret }),
  );
  await ok("/auth/logout", write(bob.accessToken));
  assert.equal(
    (await api("/users/me", { token: bob.accessToken })).status,
    401,
  );
  await ok(`/admin/users/${bob.user.id}/status`, {
    ...write(admin.accessToken, {
      status: "frozen",
      reason: "Integration test freeze",
    }),
    method: "PATCH",
  });
  assert.equal(
    (await api("/users/me", { token: restored.accessToken })).status,
    401,
  );
  assert.equal(
    (
      await api(
        "/auth/demo-login",
        write(undefined, { nickname: "Bob", resumeSecret: bob.resumeSecret }),
      )
    ).status,
    403,
  );
});
