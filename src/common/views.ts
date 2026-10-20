import type {
  Fighter,
  Fight,
  Game,
  GameSession,
  LedgerEntry,
  Quest,
  QuestRecord,
  Reward,
  User,
} from "@prisma/client";
import { fightReward } from "../public-presentation";
export const userView = (u: User) => ({
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
export const gameView = (g: Game) => ({
  ...g,
  costAtomic: g.costAtomic.toFixed(0),
});
export const sessionView = (s: GameSession) => ({
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
export const fighterView = (f: Fighter) => ({
  ...f,
  readyAt: f.readyAt.getTime(),
  createdAt: f.createdAt.toISOString(),
});
export const fightView = (f: Fight) => ({
  ...fightReward(f),
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
export const questView = (q: Quest, status?: string) => ({
  ...q,
  rewardAmount: q.rewardAmount.toFixed(0),
  rewardType: "points",
  userStatus: status ?? "not_started",
});
export const rewardView = (r: Reward) => ({
  ...r,
  amountAtomic: r.amountAtomic.toFixed(0),
});
export const recordView = (r: QuestRecord) => ({
  ...r,
  rewardAmount: r.rewardAmount.toFixed(0),
  history: [] as unknown[],
});
export const ledgerView = (l: LedgerEntry) => ({
  id: l.id,
  userId: l.userId,
  assetId: l.assetId,
  amountAtomic: l.amount.toFixed(0),
  reason: l.reason,
  businessId: l.businessId,
  transactionId: l.transactionId,
  createdAt: l.createdAt.toISOString(),
});
