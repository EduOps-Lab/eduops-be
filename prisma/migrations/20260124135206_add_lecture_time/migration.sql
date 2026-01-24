-- AlterTable
ALTER TABLE "clinics" ADD COLUMN     "instructor_id" TEXT;

-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN     "instructor_id" TEXT;

-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "instructor_id" TEXT;

-- CreateTable
CREATE TABLE "lecture_times" (
    "id" TEXT NOT NULL,
    "lecture_id" TEXT NOT NULL,
    "instructor_id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,

    CONSTRAINT "lecture_times_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lecture_times_lecture_id_idx" ON "lecture_times"("lecture_id");

-- CreateIndex
CREATE INDEX "lecture_times_instructor_id_idx" ON "lecture_times"("instructor_id");

-- AddForeignKey
ALTER TABLE "lecture_times" ADD CONSTRAINT "lecture_times_lecture_id_fkey" FOREIGN KEY ("lecture_id") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecture_times" ADD CONSTRAINT "lecture_times_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinics" ADD CONSTRAINT "clinics_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
