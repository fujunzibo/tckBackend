"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = validateConfig;
function validateConfig(env) {
    const get = (name, fallback = "") => String(env[name] ?? fallback);
    for (const name of ["JWT_USER_SECRET", "JWT_ADMIN_SECRET", "CURSOR_SECRET"]) {
        const value = get(name);
        if (value.length < 32 || /replace|change-this/i.test(value))
            throw new Error(`${name} must be an independent random secret of at least 32 characters`);
    }
    if (new Set(["JWT_USER_SECRET", "JWT_ADMIN_SECRET", "CURSOR_SECRET"].map((n) => get(n))).size !== 3)
        throw new Error("Secrets must be different");
    if (!/^postgres(ql)?:\/\//.test(get("DATABASE_URL")))
        throw new Error("DATABASE_URL must point to PostgreSQL");
    if (get("PLATFORM_MODE", "demo") !== "demo" ||
        get("MOCK_AUTH_ENABLED", "true") !== "true")
        throw new Error("This P0 release supports demo mode and demo authentication only");
    for (const name of [
        "REAL_MONEY_ENABLED",
        "CARD_CHECKOUT_ENABLED",
        "NOOVA_ENABLED",
    ]) {
        if (get(name, "false") !== "false")
            throw new Error(`${name} is not implemented in P0`);
    }
    for (const name of ["WORKER_ENABLED"])
        if (!["true", "false"].includes(get(name, "true")))
            throw new Error(`Invalid ${name}`);
    for (const [name, fallback, min, max] of [
        ["PORT", 4001, 1, 65535],
        ["JWT_USER_EXPIRES_IN_SECONDS", 86400, 60, 604800],
        ["JWT_ADMIN_EXPIRES_IN_SECONDS", 28800, 60, 86400],
        ["WORKER_INTERVAL_MS", 500, 100, 10000],
        ["DATABASE_POOL_MAX", 10, 1, 100],
        ["DATABASE_CONNECT_TIMEOUT_MS", 5000, 1000, 60000],
    ]) {
        const n = Number(get(name, String(fallback)));
        if (!Number.isInteger(n) || n < min || n > max)
            throw new Error(`Invalid ${name}`);
    }
    for (const origin of get("APP_ORIGIN", "http://127.0.0.1:3001").split(",")) {
        const url = new URL(origin.trim());
        if (!["http:", "https:"].includes(url.protocol) ||
            url.origin !== origin.trim())
            throw new Error("APP_ORIGIN must contain exact HTTP origins");
    }
    return env;
}
//# sourceMappingURL=config.js.map