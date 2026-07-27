-- CreateEnum
CREATE TYPE "Status" AS ENUM ('QUEUED', 'ACTIVE', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Jobs" (
    "id" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "priority" BOOLEAN NOT NULL DEFAULT false,
    "status" "Status" NOT NULL DEFAULT 'QUEUED',
    "result" JSONB,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "error" TEXT
);

-- CreateIndex
CREATE INDEX "Jobs_id_idx" ON "Jobs"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Jobs_id_userID_key" ON "Jobs"("id", "userID");
