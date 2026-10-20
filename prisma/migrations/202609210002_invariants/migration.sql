-- Domain checks and referential integrity beyond Prisma's scalar schema.
ALTER TABLE "User" ADD CONSTRAINT user_state CHECK (status IN ('normal','frozen') AND points >= 0 AND "platformMode" = 'demo');
ALTER TABLE "User" ADD FOREIGN KEY ("inviterId") REFERENCES "User"(id);
ALTER TABLE "Identity" ADD FOREIGN KEY ("userId") REFERENCES "User"(id);
ALTER TABLE "Invitation" ADD FOREIGN KEY ("inviterId") REFERENCES "User"(id), ADD FOREIGN KEY ("inviteeId") REFERENCES "User"(id), ADD CHECK ("inviterId" <> "inviteeId");
ALTER TABLE "AuthSession" ADD CHECK (domain IN ('user','admin'));
ALTER TABLE "Admin" ADD CHECK (role IN ('system','quest_operator','reward_operator','project_operator','auditor'));
ALTER TABLE "Account" ADD FOREIGN KEY ("assetId") REFERENCES "Asset"(id), ADD FOREIGN KEY ("userId") REFERENCES "User"(id), ADD UNIQUE (id,"assetId"), ADD CHECK (balance >= 0 OR kind = 'issuer'), ADD CHECK (kind IN ('issuer','treasury','available','hold','escrow','budget'));
ALTER TABLE "LedgerEntry" ADD FOREIGN KEY ("transactionId") REFERENCES "LedgerTransaction"(id), ADD FOREIGN KEY ("accountId","assetId") REFERENCES "Account"(id,"assetId"), ADD FOREIGN KEY ("userId") REFERENCES "User"(id), ADD CHECK (amount <> 0);
ALTER TABLE "TicketLot" ADD FOREIGN KEY ("userId") REFERENCES "User"(id), ADD CHECK (remaining >= 0 AND locked >= 0);
ALTER TABLE "TicketUse" ADD FOREIGN KEY ("userId") REFERENCES "User"(id), ADD FOREIGN KEY ("lotId") REFERENCES "TicketLot"(id), ADD CHECK (status IN ('locked','consumed','refunded'));
ALTER TABLE "Game" ADD FOREIGN KEY ("assetId") REFERENCES "Asset"(id), ADD CHECK ("costAtomic" > 0 AND version > 0 AND slug <> 'history' AND mode = 'demo');
ALTER TABLE "GameRule" ADD FOREIGN KEY ("gameId") REFERENCES "Game"(id), ADD CHECK ("amountAtomic" > 0 AND multiplier = 2);
ALTER TABLE "GameQuote" ADD FOREIGN KEY ("userId") REFERENCES "User"(id), ADD FOREIGN KEY ("gameId","ruleVersion") REFERENCES "GameRule"("gameId",version), ADD CHECK (choice IN ('heads','tails'));
ALTER TABLE "GameSession" ADD FOREIGN KEY ("userId") REFERENCES "User"(id), ADD FOREIGN KEY ("gameId","ruleVersion") REFERENCES "GameRule"("gameId",version), ADD FOREIGN KEY ("quoteId") REFERENCES "GameQuote"(id), ADD CHECK (status IN ('playing','settled','failed') AND "amountAtomic" > 0 AND "payoutAtomic" >= 0 AND "platformMode" = 'demo');
ALTER TABLE "GameQuote" ADD FOREIGN KEY ("consumedBy") REFERENCES "GameSession"(id);
ALTER TABLE "Fighter" ADD FOREIGN KEY ("userId") REFERENCES "User"(id), ADD CHECK (status IN ('generating','ready','failed') AND attempt > 0 AND "platformMode" = 'demo');
ALTER TABLE "Fight" ADD FOREIGN KEY ("userId") REFERENCES "User"(id), ADD FOREIGN KEY ("fighterId") REFERENCES "Fighter"(id), ADD CHECK (status IN ('queued','live','settled','failed') AND "platformMode" = 'demo');
CREATE UNIQUE INDEX one_active_fight_per_fighter ON "Fight"("fighterId") WHERE status IN ('queued','live');
ALTER TABLE "Quest" ADD CHECK ("rewardAmount" > 0 AND "endTime" > "startTime" AND status IN ('draft','published','offline') AND type IN ('daily','game','social') AND "reviewMode" IN ('auto','manual'));
ALTER TABLE "QuestRecord" ADD FOREIGN KEY ("userId") REFERENCES "User"(id), ADD FOREIGN KEY ("questId") REFERENCES "Quest"(id), ADD CHECK (status IN ('pending_review','completed','rejected','reward_claimed') AND "rewardAmount" > 0);
ALTER TABLE "QuestSubmission" ADD FOREIGN KEY ("recordId") REFERENCES "QuestRecord"(id), ADD FOREIGN KEY ("reviewerId") REFERENCES "Admin"(id);
ALTER TABLE "Reward" ADD FOREIGN KEY ("recordId") REFERENCES "QuestRecord"(id), ADD FOREIGN KEY ("userId") REFERENCES "User"(id), ADD FOREIGN KEY ("questId") REFERENCES "Quest"(id), ADD CHECK (status IN ('eligible','issued') AND "amountAtomic" > 0 AND "assetId" = 'POINTS');
ALTER TABLE "Notification" ADD FOREIGN KEY ("userId") REFERENCES "User"(id);
ALTER TABLE "LiveWin" ADD FOREIGN KEY ("sessionId") REFERENCES "GameSession"(id);
ALTER TABLE "Outbox" ADD FOREIGN KEY ("userId") REFERENCES "User"(id);
ALTER TABLE "Job" ADD FOREIGN KEY ("userId") REFERENCES "User"(id), ADD CHECK (status IN ('pending','running','completed','dead') AND attempt >= 0);
ALTER TABLE "HoldingSnapshot" ADD FOREIGN KEY ("userId") REFERENCES "User"(id);
ALTER TABLE "LegacyIdentityLink" ADD FOREIGN KEY ("userId") REFERENCES "User"(id);
ALTER TABLE "Setting" ADD CHECK ("maxFighters" BETWEEN 1 AND 10 AND "gameCostAtomic" BETWEEN 1 AND 1000);

-- A journal transaction is balanced in exactly one asset at COMMIT time.
CREATE FUNCTION wins_check_transaction() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target text; amount_sum numeric; asset_count bigint; entry_count bigint;
BEGIN
  IF TG_TABLE_NAME = 'LedgerTransaction' THEN target := NEW.id; ELSE target := NEW."transactionId"; END IF;
  SELECT sum(amount), count(DISTINCT "assetId"), count(*) INTO amount_sum, asset_count, entry_count FROM "LedgerEntry" WHERE "transactionId" = target;
  IF entry_count < 2 OR asset_count <> 1 OR amount_sum <> 0 THEN RAISE EXCEPTION 'Unbalanced ledger transaction' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER transaction_balanced AFTER INSERT ON "LedgerTransaction" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION wins_check_transaction();
CREATE CONSTRAINT TRIGGER entries_balanced AFTER INSERT ON "LedgerEntry" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION wins_check_transaction();

-- Account balances are projections, never independent mutable financial facts.
CREATE FUNCTION wins_check_balance() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target text; actual numeric; projected numeric;
BEGIN
  IF TG_TABLE_NAME = 'Account' THEN target := NEW.id; ELSE target := NEW."accountId"; END IF;
  SELECT balance INTO projected FROM "Account" WHERE id = target;
  SELECT COALESCE(sum(amount),0) INTO actual FROM "LedgerEntry" WHERE "accountId" = target;
  IF projected <> actual THEN RAISE EXCEPTION 'Account projection mismatch' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER account_projection AFTER INSERT OR UPDATE ON "Account" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION wins_check_balance();
CREATE CONSTRAINT TRIGGER entry_projection AFTER INSERT ON "LedgerEntry" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION wins_check_balance();
CREATE FUNCTION wins_immutable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Immutable record' USING ERRCODE = '23514'; END $$;
CREATE TRIGGER immutable_entries BEFORE UPDATE OR DELETE ON "LedgerEntry" FOR EACH ROW EXECUTE FUNCTION wins_immutable();
CREATE TRIGGER immutable_transactions BEFORE UPDATE OR DELETE ON "LedgerTransaction" FOR EACH ROW EXECUTE FUNCTION wins_immutable();
CREATE TRIGGER immutable_rules BEFORE UPDATE OR DELETE ON "GameRule" FOR EACH ROW EXECUTE FUNCTION wins_immutable();
CREATE TRIGGER immutable_audit BEFORE UPDATE OR DELETE ON "AuditLog" FOR EACH ROW EXECUTE FUNCTION wins_immutable();
CREATE TRIGGER immutable_config_versions BEFORE UPDATE OR DELETE ON "ConfigVersion" FOR EACH ROW EXECUTE FUNCTION wins_immutable();
CREATE INDEX notifications_unread ON "Notification"("userId", "createdAt" DESC, id DESC) WHERE "readAt" IS NULL;
