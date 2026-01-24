/*
  Warnings:

  - You are about to drop the column `child_name_hint` on the `app_parents` table. All the data in the column will be lost.
  - You are about to drop the `VerificationCode` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "app_parents" DROP COLUMN "child_name_hint",
ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "app_students" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "assistants" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "instructors" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "VerificationCode";

-- CreateTable
CREATE TABLE "verification_codes" (
    "id" TEXT NOT NULL,
    "target_phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_type" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_user_type_idx" ON "sessions"("user_id", "user_type");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_user_id_user_type_key" ON "sessions"("user_id", "user_type");
