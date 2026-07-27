-- DropIndex
DROP INDEX "Jobs_id_idx";

-- DropIndex
DROP INDEX "Jobs_id_userID_key";

-- AlterTable
ALTER TABLE "Jobs" ADD CONSTRAINT "Jobs_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "Jobs_userID_idx" ON "Jobs"("userID");
