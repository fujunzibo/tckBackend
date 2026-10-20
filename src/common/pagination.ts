import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";
import { canonical, hash } from "./util";
import { fail } from "./errors";
import type { ListQuery } from "./dto";
export const offset = (q: ListQuery) => ({
  take: q.pageSize,
  skip: (q.page - 1) * q.pageSize,
});
export async function paged<T>(
  q: ListQuery,
  items: Promise<T[]>,
  count: Promise<number>,
) {
  const [rows, total] = await Promise.all([items, count]);
  return {
    items: rows,
    pagination: {
      page: q.page,
      pageSize: q.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    },
  };
}
export const newest = [{ createdAt: "desc" }, { id: "desc" }] as const;
@Injectable()
export class Cursors {
  constructor(private readonly config: ConfigService) {}
  private sign(text: string) {
    return createHmac("sha256", this.config.getOrThrow("CURSOR_SECRET"))
      .update(text)
      .digest("base64url");
  }
  private scope(q: ListQuery, identity: string) {
    const { cursor: _cursor, page: _page, ...filter } = q;
    void _cursor;
    void _page;
    return hash(identity + canonical(filter));
  }
  after(
    q: ListQuery,
    identity: string,
  ): {
    OR?: { createdAt: Date | Prisma.DateTimeFilter; id?: { lt: string } }[];
  } {
    if (!q.cursor) return {};
    try {
      const [text, signature, extra] = q.cursor.split(".");
      const expected = Buffer.from(this.sign(text)),
        actual = Buffer.from(signature ?? "");
      if (
        extra ||
        expected.length !== actual.length ||
        !timingSafeEqual(expected, actual)
      )
        throw new Error();
      const payload = JSON.parse(
        Buffer.from(text, "base64url").toString("utf8"),
      ) as { id: string; at: string; scope: string };
      if (
        payload.scope !== this.scope(q, identity) ||
        typeof payload.id !== "string" ||
        !Number.isFinite(Date.parse(payload.at))
      )
        throw new Error();
      return {
        OR: [
          { createdAt: { lt: new Date(payload.at) } },
          { createdAt: new Date(payload.at), id: { lt: payload.id } },
        ],
      };
    } catch {
      fail(
        409,
        "CURSOR_EXPIRED",
        "Refresh this list; cursor or filters have changed",
      );
    }
  }
  result<T extends { id: string; createdAt: Date }, R>(
    rows: T[],
    q: ListQuery,
    identity: string,
    view: (row: T) => R,
  ) {
    const hasMore = rows.length > q.pageSize,
      items = rows.slice(0, q.pageSize),
      last = items.at(-1);
    const encoded = last
      ? Buffer.from(
          JSON.stringify({
            id: last.id,
            at: last.createdAt.toISOString(),
            scope: this.scope(q, identity),
          }),
        ).toString("base64url")
      : "";
    return {
      items: items.map(view),
      hasMore,
      nextCursor:
        hasMore && encoded ? `${encoded}.${this.sign(encoded)}` : null,
    };
  }
}
