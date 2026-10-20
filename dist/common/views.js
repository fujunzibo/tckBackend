"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ledgerView = exports.recordView = exports.rewardView = exports.questView = exports.fightView = exports.fighterView = exports.sessionView = exports.gameView = exports.userView = void 0;
const public_presentation_1 = require("../public-presentation");
const userView = (u) => ({
    id: u.id,
    nickname: u.nickname,
    walletAddress: u.walletAddress ?? "",
    invitationCode: u.invitationCode,
    inviterId: u.inviterId ?? undefined,
    pointsExact: u.points.toFixed(0),
    level: u.level,
    status: u.status,
    createdAt: u.createdAt.toISOString(),
    platformMode: u.platformMode,
    dataSource: u.dataSource,
    actorType: u.actorType,
});
exports.userView = userView;
const gameView = (g) => ({
    ...g,
    costAtomic: g.costAtomic.toFixed(0),
});
exports.gameView = gameView;
const sessionView = (s) => ({
    id: s.id,
    userId: s.userId,
    gameId: s.gameId,
    choice: s.choice,
    outcome: s.status === "settled" ? s.outcome : "",
    won: s.status === "settled" && s.choice === s.outcome,
    status: s.status,
    amountAtomic: s.amountAtomic.toFixed(0),
    payoutAtomic: s.status === "settled" ? s.payoutAtomic.toFixed(0) : "0",
    assetId: s.assetId,
    readyAt: s.readyAt.getTime(),
    createdAt: s.createdAt.toISOString(),
    version: s.version,
    platformMode: s.platformMode,
    dataSource: s.dataSource,
    actorType: s.actorType,
    ruleVersion: s.ruleVersion,
    resultHash: s.status === "settled" ? s.resultHash : undefined,
    engineVersion: s.engineVersion,
});
exports.sessionView = sessionView;
const fighterView = (f) => ({
    ...f,
    readyAt: f.readyAt.getTime(),
    createdAt: f.createdAt.toISOString(),
});
exports.fighterView = fighterView;
const fightView = (f) => ({
    ...(0, public_presentation_1.fightReward)(f),
    id: f.id,
    userId: f.userId,
    fighterId: f.fighterId,
    opponent: f.opponent,
    status: f.status,
    won: f.status === "settled" && f.won,
    readyAt: f.readyAt.getTime(),
    createdAt: f.createdAt.toISOString(),
    version: f.version,
    platformMode: f.platformMode,
    dataSource: f.dataSource,
    actorType: f.actorType,
    resultHash: f.status === "settled" ? f.resultHash : undefined,
});
exports.fightView = fightView;
const questView = (q, status) => ({
    ...q,
    rewardAmount: q.rewardAmount.toFixed(0),
    rewardType: "points",
    userStatus: status ?? "not_started",
});
exports.questView = questView;
const rewardView = (r) => ({
    ...r,
    amountAtomic: r.amountAtomic.toFixed(0),
});
exports.rewardView = rewardView;
const recordView = (r) => ({
    ...r,
    rewardAmount: r.rewardAmount.toFixed(0),
    history: [],
});
exports.recordView = recordView;
const ledgerView = (l) => ({
    id: l.id,
    userId: l.userId,
    assetId: l.assetId,
    amountAtomic: l.amount.toFixed(0),
    reason: l.reason,
    businessId: l.businessId,
    transactionId: l.transactionId,
    createdAt: l.createdAt.toISOString(),
});
exports.ledgerView = ledgerView;
//# sourceMappingURL=views.js.map