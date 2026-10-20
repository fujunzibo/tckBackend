-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nickname" VARCHAR(64) NOT NULL,
    "walletAddress" TEXT,
    "invitationCode" TEXT NOT NULL,
    "inviterId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'normal',
    "points" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "level" TEXT NOT NULL DEFAULT 'Bronze',
    "platformMode" TEXT NOT NULL DEFAULT 'demo',
    "dataSource" TEXT NOT NULL DEFAULT 'native',
    "actorType" TEXT NOT NULL DEFAULT 'player',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Identity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Identity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "entryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "effectiveAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL DEFAULT 0,
    "chainId" TEXT NOT NULL DEFAULT 'demo-ledger',
    "platformMode" TEXT NOT NULL DEFAULT 'demo',

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "assetId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "balance" DECIMAL(78,0) NOT NULL DEFAULT 0,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerTransaction" (
    "id" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userId" TEXT,
    "assetId" TEXT NOT NULL,
    "amount" DECIMAL(78,0) NOT NULL,
    "reason" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketLot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "remaining" INTEGER NOT NULL,
    "locked" INTEGER NOT NULL DEFAULT 0,
    "purpose" TEXT NOT NULL DEFAULT 'fighter',
    "expiresAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketUse" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'locked',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketUse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" JSONB NOT NULL,
    "kind" TEXT NOT NULL,
    "chainId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'demo',
    "status" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "costAtomic" DECIMAL(78,0) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRule" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "amountAtomic" DECIMAL(78,0) NOT NULL,
    "multiplier" INTEGER NOT NULL DEFAULT 2,
    "engineVersion" TEXT NOT NULL DEFAULT 'coin-flip-demo-v1',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameQuote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "choice" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "amountAtomic" DECIMAL(78,0) NOT NULL,
    "ruleVersion" INTEGER NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "consumedBy" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "choice" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "randomSeed" TEXT NOT NULL,
    "resultHash" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL DEFAULT 'coin-flip-demo-v1',
    "ruleVersion" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'playing',
    "amountAtomic" DECIMAL(78,0) NOT NULL,
    "payoutAtomic" DECIMAL(78,0) NOT NULL,
    "assetId" TEXT NOT NULL,
    "readyAt" TIMESTAMPTZ(3) NOT NULL,
    "settledAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "platformMode" TEXT NOT NULL DEFAULT 'demo',
    "dataSource" TEXT NOT NULL DEFAULT 'native',
    "actorType" TEXT NOT NULL DEFAULT 'player',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fighter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'generating',
    "power" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL,
    "defense" INTEGER NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "simulateFailure" BOOLEAN NOT NULL DEFAULT false,
    "refunded" BOOLEAN NOT NULL DEFAULT false,
    "readyAt" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "platformMode" TEXT NOT NULL DEFAULT 'demo',
    "dataSource" TEXT NOT NULL DEFAULT 'native',
    "actorType" TEXT NOT NULL DEFAULT 'player',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fighter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fighterId" TEXT NOT NULL,
    "opponent" TEXT NOT NULL DEFAULT 'NOVA · Training bot',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "won" BOOLEAN NOT NULL,
    "randomSeed" TEXT NOT NULL,
    "resultHash" TEXT NOT NULL,
    "readyAt" TIMESTAMPTZ(3) NOT NULL,
    "settledAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "platformMode" TEXT NOT NULL DEFAULT 'demo',
    "dataSource" TEXT NOT NULL DEFAULT 'native',
    "actorType" TEXT NOT NULL DEFAULT 'player',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "type" TEXT NOT NULL,
    "rewardAmount" DECIMAL(78,0) NOT NULL,
    "reviewMode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "entryId" TEXT NOT NULL DEFAULT 'tck-originals',
    "startTime" TIMESTAMPTZ(3) NOT NULL,
    "endTime" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "proof" TEXT NOT NULL,
    "rejectReason" TEXT,
    "rewardAmount" DECIMAL(78,0) NOT NULL,
    "questVersion" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "submittedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestSubmission" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "proof" TEXT NOT NULL,
    "reason" TEXT,
    "action" TEXT,
    "reviewerId" TEXT,
    "submittedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMPTZ(3),

    CONSTRAINT "QuestSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "amountAtomic" DECIMAL(78,0) NOT NULL,
    "assetId" TEXT NOT NULL DEFAULT 'POINTS',
    "status" TEXT NOT NULL DEFAULT 'eligible',
    "issuedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "body" JSONB NOT NULL,
    "href" TEXT NOT NULL,
    "readAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveWin" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "payoutAtomic" DECIMAL(78,0) NOT NULL,
    "assetId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'demo',
    "actorType" TEXT NOT NULL DEFAULT 'player',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveWin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "version" INTEGER NOT NULL DEFAULT 1,
    "maintenance" BOOLEAN NOT NULL DEFAULT false,
    "gameCostAtomic" DECIMAL(78,0) NOT NULL DEFAULT 25,
    "maxFighters" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigVersion" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "actorId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfigVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Idempotency" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Idempotency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "runAt" TIMESTAMPTZ(3) NOT NULL,
    "leaseUntil" TIMESTAMPTZ(3),
    "leaseOwner" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outbox" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityVersion" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "publishedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerHeartbeat" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "WorkerHeartbeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HoldingSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chainId" TEXT NOT NULL DEFAULT 'demo-ledger',
    "balance" DECIMAL(78,0) NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'demo',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HoldingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegacyIdentityLink" (
    "id" TEXT NOT NULL,
    "sourceSystem" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unverified',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegacyIdentityLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_invitationCode_key" ON "User"("invitationCode");

-- CreateIndex
CREATE INDEX "User_inviterId_idx" ON "User"("inviterId");

-- CreateIndex
CREATE INDEX "User_points_id_idx" ON "User"("points" DESC, "id");

-- CreateIndex
CREATE INDEX "User_createdAt_id_idx" ON "User"("createdAt" DESC, "id");

-- CreateIndex
CREATE INDEX "Identity_userId_idx" ON "Identity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Identity_provider_subject_key" ON "Identity"("provider", "subject");

-- CreateIndex
CREATE INDEX "AuthSession_subjectId_domain_idx" ON "AuthSession"("subjectId", "domain");

-- CreateIndex
CREATE INDEX "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_inviteeId_key" ON "Invitation"("inviteeId");

-- CreateIndex
CREATE INDEX "Invitation_inviterId_createdAt_idx" ON "Invitation"("inviterId", "createdAt");

-- CreateIndex
CREATE INDEX "Account_userId_assetId_idx" ON "Account"("userId", "assetId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerTransaction_businessKey_key" ON "LedgerTransaction"("businessKey");

-- CreateIndex
CREATE INDEX "LedgerEntry_userId_createdAt_id_idx" ON "LedgerEntry"("userId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "LedgerEntry_accountId_idx" ON "LedgerEntry"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_transactionId_accountId_key" ON "LedgerEntry"("transactionId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketLot_businessKey_key" ON "TicketLot"("businessKey");

-- CreateIndex
CREATE INDEX "TicketLot_userId_expiresAt_idx" ON "TicketLot"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TicketUse_businessKey_key" ON "TicketUse"("businessKey");

-- CreateIndex
CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");

-- CreateIndex
CREATE INDEX "Game_status_kind_idx" ON "Game"("status", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "GameRule_gameId_version_key" ON "GameRule"("gameId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "GameQuote_consumedBy_key" ON "GameQuote"("consumedBy");

-- CreateIndex
CREATE INDEX "GameQuote_userId_expiresAt_idx" ON "GameQuote"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "GameSession_quoteId_key" ON "GameSession"("quoteId");

-- CreateIndex
CREATE INDEX "GameSession_userId_createdAt_id_idx" ON "GameSession"("userId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "Fighter_userId_status_idx" ON "Fighter"("userId", "status");

-- CreateIndex
CREATE INDEX "Fight_userId_createdAt_id_idx" ON "Fight"("userId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "Quest_status_type_idx" ON "Quest"("status", "type");

-- CreateIndex
CREATE INDEX "QuestRecord_status_submittedAt_idx" ON "QuestRecord"("status", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuestRecord_userId_questId_periodKey_key" ON "QuestRecord"("userId", "questId", "periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "QuestSubmission_recordId_version_key" ON "QuestSubmission"("recordId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Reward_recordId_key" ON "Reward"("recordId");

-- CreateIndex
CREATE INDEX "Reward_userId_status_createdAt_idx" ON "Reward"("userId", "status", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Notification_eventKey_key" ON "Notification"("eventKey");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_id_idx" ON "Notification"("userId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "LiveWin_sessionId_key" ON "LiveWin"("sessionId");

-- CreateIndex
CREATE INDEX "LiveWin_createdAt_id_idx" ON "LiveWin"("createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ConfigVersion_version_key" ON "ConfigVersion"("version");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_id_idx" ON "AuditLog"("createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Idempotency_subject_operation_key_key" ON "Idempotency"("subject", "operation", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Job_businessKey_key" ON "Job"("businessKey");

-- CreateIndex
CREATE INDEX "Job_status_runAt_idx" ON "Job"("status", "runAt");

-- CreateIndex
CREATE UNIQUE INDEX "Outbox_eventKey_key" ON "Outbox"("eventKey");

-- CreateIndex
CREATE INDEX "Outbox_publishedAt_createdAt_idx" ON "Outbox"("publishedAt", "createdAt");

-- CreateIndex
CREATE INDEX "HoldingSnapshot_userId_createdAt_idx" ON "HoldingSnapshot"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ImportBatch_checksum_key" ON "ImportBatch"("checksum");

-- CreateIndex
CREATE UNIQUE INDEX "LegacyIdentityLink_sourceSystem_sourceId_key" ON "LegacyIdentityLink"("sourceSystem", "sourceId");
