-- CreateTable
CREATE TABLE "game_rounds" (
    "id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "progress_version" INTEGER NOT NULL,
    "picked_score" INTEGER NOT NULL,
    "credited_score" INTEGER NOT NULL,
    "total_score_after" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "game_rounds_player_id_progress_version_created_at_idx" ON "game_rounds"("player_id", "progress_version", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "game_rounds_player_id_progress_version_request_id_key" ON "game_rounds"("player_id", "progress_version", "request_id");

-- AddForeignKey
ALTER TABLE "game_rounds" ADD CONSTRAINT "game_rounds_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Business rule constraints (not expressible in the Prisma schema)
ALTER TABLE "game_rounds" ADD CONSTRAINT "game_rounds_picked_score_option" CHECK ("picked_score" IN (300, 500, 1000, 3000));
ALTER TABLE "game_rounds" ADD CONSTRAINT "game_rounds_credited_score_range" CHECK ("credited_score" BETWEEN 0 AND "picked_score");
ALTER TABLE "game_rounds" ADD CONSTRAINT "game_rounds_total_score_after_range" CHECK ("total_score_after" BETWEEN 0 AND 10000);
ALTER TABLE "game_rounds" ADD CONSTRAINT "game_rounds_progress_version_min" CHECK ("progress_version" >= 1);
