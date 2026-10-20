import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { Prisma } from "@prisma/client";
import { fail } from "./errors";
export const hash = (text: string) =>
  createHash("sha256").update(text).digest("hex");
export const secret = () => randomBytes(32).toString("hex");
export function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function passwordMatches(password: string, encoded: string) {
  const [scheme, salt, expected] = encoded.split(":");
  if (scheme !== "scrypt" || !salt || !expected) return false;
  const result = scryptSync(password, salt, 64),
    bytes = Buffer.from(expected, "hex");
  return result.length === bytes.length && timingSafeEqual(result, bytes);
}
export function atomic(
  value: string,
  allowNegative = false,
  max = 10n ** 77n - 1n,
) {
  if (
    !(allowNegative ? /^-?(0|[1-9]\d{0,76})$/ : /^(0|[1-9]\d{0,76})$/).test(
      value,
    )
  )
    fail(422, "AMOUNT_OUT_OF_RANGE", "Amount must be an integer string");
  const n = BigInt(value);
  if (n > max || n < -max)
    fail(422, "AMOUNT_OUT_OF_RANGE", "Amount exceeds the limit");
  return n;
}
export const json = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
export const copy = (zh: string, en = zh, ja = en, ko = en) => ({
  zh,
  en,
  ja,
  ko,
});
export const period = (type: string) =>
  type === "daily" ? new Date().toISOString().slice(0, 10) : "once";
export const levelFor = (n: bigint) =>
  n >= 20000n
    ? "Platinum"
    : n >= 5000n
      ? "Gold"
      : n >= 1000n
        ? "Silver"
        : "Bronze";
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
