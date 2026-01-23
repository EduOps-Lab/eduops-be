/*
  Warnings:

  - You are about to drop the column `email` on the `app_parents` table. All the data in the column will be lost.
  - You are about to drop the column `email_verified` on the `app_parents` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `app_parents` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `app_students` table. All the data in the column will be lost.
  - You are about to drop the column `email_verified` on the `app_students` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `app_students` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `app_students` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `assistants` table. All the data in the column will be lost.
  - You are about to drop the column `email_verified` on the `assistants` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `assistants` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `assistants` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `instructors` table. All the data in the column will be lost.
  - You are about to drop the column `email_verified` on the `instructors` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `instructors` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `instructors` table. All the data in the column will be lost.
  - You are about to drop the `sessions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `app_parents` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `app_students` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `assistants` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `instructors` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `app_parents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `app_students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `assistants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `instructors` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "app_parents_email_key";

-- DropIndex
DROP INDEX "app_students_email_key";

-- DropIndex
DROP INDEX "assistants_email_key";

-- DropIndex
DROP INDEX "instructors_email_key";

-- AlterTable
ALTER TABLE "app_parents" DROP COLUMN "email",
DROP COLUMN "email_verified",
DROP COLUMN "password",
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "app_students" DROP COLUMN "email",
DROP COLUMN "email_verified",
DROP COLUMN "name",
DROP COLUMN "password",
ADD COLUMN     "grade" TEXT,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "assistants" DROP COLUMN "email",
DROP COLUMN "email_verified",
DROP COLUMN "name",
DROP COLUMN "password",
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "instructors" DROP COLUMN "email",
DROP COLUMN "email_verified",
DROP COLUMN "name",
DROP COLUMN "password",
ADD COLUMN     "user_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "sessions";

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_type" TEXT NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "app_parents_user_id_key" ON "app_parents"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_students_user_id_key" ON "app_students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "assistants_user_id_key" ON "assistants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "instructors_user_id_key" ON "instructors"("user_id");

-- AddForeignKey
ALTER TABLE "app_students" ADD CONSTRAINT "app_students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_parents" ADD CONSTRAINT "app_parents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructors" ADD CONSTRAINT "instructors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistants" ADD CONSTRAINT "assistants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
