"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cursors = exports.newest = exports.offset = void 0;
exports.paged = paged;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_crypto_1 = require("node:crypto");
const util_1 = require("./util");
const errors_1 = require("./errors");
const offset = (q) => ({
    take: q.pageSize,
    skip: (q.page - 1) * q.pageSize,
});
exports.offset = offset;
async function paged(q, items, count) {
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
exports.newest = [{ createdAt: "desc" }, { id: "desc" }];
let Cursors = class Cursors {
    config;
    constructor(config) {
        this.config = config;
    }
    sign(text) {
        return (0, node_crypto_1.createHmac)("sha256", this.config.getOrThrow("CURSOR_SECRET"))
            .update(text)
            .digest("base64url");
    }
    scope(q, identity) {
        const { cursor: _cursor, page: _page, ...filter } = q;
        void _cursor;
        void _page;
        return (0, util_1.hash)(identity + (0, util_1.canonical)(filter));
    }
    after(q, identity) {
        if (!q.cursor)
            return {};
        try {
            const [text, signature, extra] = q.cursor.split(".");
            const expected = Buffer.from(this.sign(text)), actual = Buffer.from(signature ?? "");
            if (extra ||
                expected.length !== actual.length ||
                !(0, node_crypto_1.timingSafeEqual)(expected, actual))
                throw new Error();
            const payload = JSON.parse(Buffer.from(text, "base64url").toString("utf8"));
            if (payload.scope !== this.scope(q, identity) ||
                typeof payload.id !== "string" ||
                !Number.isFinite(Date.parse(payload.at)))
                throw new Error();
            return {
                OR: [
                    { createdAt: { lt: new Date(payload.at) } },
                    { createdAt: new Date(payload.at), id: { lt: payload.id } },
                ],
            };
        }
        catch {
            (0, errors_1.fail)(409, "CURSOR_EXPIRED", "Refresh this list; cursor or filters have changed");
        }
    }
    result(rows, q, identity, view) {
        const hasMore = rows.length > q.pageSize, items = rows.slice(0, q.pageSize), last = items.at(-1);
        const encoded = last
            ? Buffer.from(JSON.stringify({
                id: last.id,
                at: last.createdAt.toISOString(),
                scope: this.scope(q, identity),
            })).toString("base64url")
            : "";
        return {
            items: items.map(view),
            hasMore,
            nextCursor: hasMore && encoded ? `${encoded}.${this.sign(encoded)}` : null,
        };
    }
};
exports.Cursors = Cursors;
exports.Cursors = Cursors = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], Cursors);
//# sourceMappingURL=pagination.js.map