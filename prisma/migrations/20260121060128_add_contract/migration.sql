/*
  Warnings:

  - You are about to drop the column `contract_sented_at` on the `assistants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "assistants" DROP COLUMN "contract_sented_at",
ADD COLUMN     "contract" TEXT;
