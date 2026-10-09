-- CreateTable
CREATE TABLE "players" (
    "id" UUID NOT NULL,
    "total_score" INTEGER NOT NULL DEFAULT 0,
    "progress_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_sessions" (
    "id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkpoints" (
    "id" TEXT NOT NULL,
    "required_score" INTEGER NOT NULL,
    "reward_name" TEXT NOT NULL,

    CONSTRAINT "checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "player_sessions_token_hash_key" ON "player_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "player_sessions_player_id_idx" ON "player_sessions"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "checkpoints_required_score_key" ON "checkpoints"("required_score");

-- AddForeignKey
ALTER TABLE "player_sessions" ADD CONSTRAINT "player_sessions_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Business rule constraints (not expressible in the Prisma schema)
ALTER TABLE "players" ADD CONSTRAINT "players_total_score_range" CHECK ("total_score" BETWEEN 0 AND 10000);
ALTER TABLE "players" ADD CONSTRAINT "players_progress_version_min" CHECK ("progress_version" >= 1);
ALTER TABLE "checkpoints" ADD CONSTRAINT "checkpoints_required_score_range" CHECK ("required_score" BETWEEN 1 AND 10000);

-- Reference data
INSERT INTO "checkpoints" ("id", "required_score", "reward_name") VALUES
    ('checkpoint-5000', 5000, 'รางวัล A'),
    ('checkpoint-7500', 7500, 'รางวัล B'),
    ('checkpoint-10000', 10000, 'รางวัล C');
