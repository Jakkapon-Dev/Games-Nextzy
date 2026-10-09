-- CreateTable
CREATE TABLE "reward_claims" (
    "id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "checkpoint_id" TEXT NOT NULL,
    "progress_version" INTEGER NOT NULL,
    "claimed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reward_claims_player_id_progress_version_claimed_at_idx" ON "reward_claims"("player_id", "progress_version", "claimed_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "reward_claims_player_id_progress_version_checkpoint_id_key" ON "reward_claims"("player_id", "progress_version", "checkpoint_id");

-- AddForeignKey
ALTER TABLE "reward_claims" ADD CONSTRAINT "reward_claims_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_claims" ADD CONSTRAINT "reward_claims_checkpoint_id_fkey" FOREIGN KEY ("checkpoint_id") REFERENCES "checkpoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Business rule constraints (not expressible in the Prisma schema)
ALTER TABLE "reward_claims" ADD CONSTRAINT "reward_claims_progress_version_min" CHECK ("progress_version" >= 1);
