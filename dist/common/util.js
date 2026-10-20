"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.levelFor = exports.period = exports.copy = exports.json = exports.secret = exports.hash = void 0;
exports.passwordHash = passwordHash;
exports.passwordMatches = passwordMatches;
exports.atomic = atomic;
exports.canonical = canonical;
const node_crypto_1 = require("node:crypto");
const errors_1 = require("./errors");
const hash = (text) => (0, node_crypto_1.createHash)("sha256").update(text).digest("hex");
exports.hash = hash;
const secret = () => (0, node_crypto_1.randomBytes)(32).toString("hex");
exports.secret = secret;
function passwordHash(password) {
    const salt = (0, node_crypto_1.randomBytes)(16).toString("hex");
    return `scrypt:${salt}:${(0, node_crypto_1.scryptSync)(password, salt, 64).toString("hex")}`;
}
function passwordMatches(password, encoded) {
    const [scheme, salt, expected] = encoded.split(":");
    if (scheme !== "scrypt" || !salt || !expected)
        return false;
    const result = (0, node_crypto_1.scryptSync)(password, salt, 64), bytes = Buffer.from(expected, "hex");
    return result.length === bytes.length && (0, node_crypto_1.timingSafeEqual)(result, bytes);
}
function atomic(value, allowNegative = false, max = 10n ** 77n - 1n) {
    if (!(allowNegative ? /^-?(0|[1-9]\d{0,76})$/ : /^(0|[1-9]\d{0,76})$/).test(value))
        (0, errors_1.fail)(422, "AMOUNT_OUT_OF_RANGE", "Amount must be an integer string");
    const n = BigInt(value);
    if (n > max || n < -max)
        (0, errors_1.fail)(422, "AMOUNT_OUT_OF_RANGE", "Amount exceeds the limit");
    return n;
}
const json = (value) => JSON.parse(JSON.stringify(value));
exports.json = json;
const copy = (zh, en = zh, ja = en, ko = en) => ({
    zh,
    en,
    ja,
    ko,
});
exports.copy = copy;
const period = (type) => type === "daily" ? new Date().toISOString().slice(0, 10) : "once";
exports.period = period;
const levelFor = (n) => n >= 20000n
    ? "Platinum"
    : n >= 5000n
        ? "Gold"
        : n >= 1000n
            ? "Silver"
            : "Bronze";
exports.levelFor = levelFor;
function canonical(value) {
    if (Array.isArray(value))
        return `[${value.map(canonical).join(",")}]`;
    if (value && typeof value === "object")
        return `{${Object.entries(value)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
            .join(",")}}`;
    return JSON.stringify(value) ?? "null";
}
//# sourceMappingURL=util.js.map