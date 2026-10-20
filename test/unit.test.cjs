const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  atomic,
  canonical,
  passwordHash,
  passwordMatches,
  levelFor,
} = require("../dist/common/util");
const { validateConfig } = require("../dist/config");
const { Cursors } = require("../dist/common/pagination");
test("amounts remain precise and reject fractions or out-of-range values", () => {
  assert.equal(atomic("900719925474099312345"), 900719925474099312345n);
  for (const value of ["1.1", "1e4", "-1", "01", "0x10", "9".repeat(78)])
    assert.throws(() => atomic(value));
  assert.equal(atomic("-25", true), -25n);
  assert.equal(levelFor(5000n), "Gold");
});
test("passwords are salted and request fingerprints are stable", () => {
  const a = passwordHash("local-demo-password"),
    b = passwordHash("local-demo-password");
  assert.notEqual(a, b);
  assert.ok(passwordMatches("local-demo-password", a));
  assert.equal(passwordMatches("wrong", a), false);
  assert.equal(canonical({ b: 2, a: [1, 3] }), canonical({ a: [1, 3], b: 2 }));
});
test("configuration rejects mixed environments and shared or default secrets", () => {
  const env = {
    DATABASE_URL: "postgresql://u:p@localhost/tck_wins_test",
    JWT_USER_SECRET: "u".repeat(40),
    JWT_ADMIN_SECRET: "a".repeat(40),
    CURSOR_SECRET: "c".repeat(40),
  };
  assert.equal(validateConfig(env), env);
  for (const patch of [
    { REAL_MONEY_ENABLED: "true" },
    { PLATFORM_MODE: "live" },
    { JWT_ADMIN_SECRET: env.JWT_USER_SECRET },
    { PORT: "NaN" },
    { APP_ORIGIN: "*" },
  ])
    assert.throws(() => validateConfig({ ...env, ...patch }));
});
test("cursors bind the user and filters and reject tampering", () => {
  const c = new Cursors({ getOrThrow: () => "c".repeat(40) }),
    q = { page: 1, pageSize: 1, assetId: "SSC" };
  const result = c.result(
    [
      { id: "a", createdAt: new Date() },
      { id: "b", createdAt: new Date() },
    ],
    q,
    "ledger:user1",
    (v) => v,
  );
  assert.ok(result.hasMore);
  assert.ok(c.after({ ...q, cursor: result.nextCursor }, "ledger:user1").OR);
  assert.throws(() =>
    c.after({ ...q, cursor: result.nextCursor }, "ledger:user2"),
  );
  assert.throws(() =>
    c.after({ ...q, assetId: "IP", cursor: result.nextCursor }, "ledger:user1"),
  );
  assert.throws(() =>
    c.after({ ...q, cursor: result.nextCursor + "x" }, "ledger:user1"),
  );
});
