/*
  Warnings:

  - You are about to drop the column `grade` on the `app_students` table. All the data in the column will be lost.
  - Added the required column `school` to the `enrollments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `school_year` to the `enrollments` table without a default value. This is not possible if the table is not empty.
  - Made the column `instructor_id` on table `enrollments` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_instructor_id_fkey";

-- AlterTable
ALTER TABLE "app_students" DROP COLUMN "grade",
ADD COLUMN     "school_year" TEXT;

-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN     "school" TEXT NOT NULL,
ADD COLUMN     "school_year" TEXT NOT NULL,
ALTER COLUMN "instructor_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
