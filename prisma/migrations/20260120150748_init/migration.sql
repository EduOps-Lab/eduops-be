-- CreateTable
CREATE TABLE "app_students" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "school" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_parents" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "child_name_hint" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentChildLink" (
    "id" SERIAL NOT NULL,
    "appParentId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentChildLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCode" (
    "id" SERIAL NOT NULL,
    "targetPhone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructors" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "subject" TEXT,
    "academy" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "instructors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistants" (
    "id" SERIAL NOT NULL,
    "instructor_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "signup_code" TEXT,
    "contract_sented_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_codes" (
    "code" TEXT NOT NULL,
    "instructor_id" INTEGER NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "expire_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_codes_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "lectures" (
    "id" SERIAL NOT NULL,
    "instructor_id" INTEGER NOT NULL,
    "subject" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "lectures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" SERIAL NOT NULL,
    "lecture_id" INTEGER NOT NULL,
    "student_name" TEXT NOT NULL,
    "student_phone" TEXT NOT NULL,
    "parent_phone" TEXT NOT NULL,
    "app_student_id" INTEGER,
    "app_parent_link_id" INTEGER,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" SERIAL NOT NULL,
    "enrollment_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABSENT',
    "enter_time" TIMESTAMP(3),
    "leave_time" TIMESTAMP(3),
    "memo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" SERIAL NOT NULL,
    "lecture_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "cutoff_score" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" SERIAL NOT NULL,
    "exam_id" INTEGER NOT NULL,
    "lecture_id" INTEGER NOT NULL,
    "question_number" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MULTIPLE',
    "score" INTEGER NOT NULL DEFAULT 0,
    "choices" JSONB,
    "source" TEXT,
    "correct_answer" TEXT NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_answers" (
    "id" SERIAL NOT NULL,
    "lecture_id" INTEGER NOT NULL,
    "enrollment_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "submitted_answer" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "student_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" SERIAL NOT NULL,
    "lecture_id" INTEGER NOT NULL,
    "exam_id" INTEGER NOT NULL,
    "enrollment_id" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "is_pass" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_logs" (
    "id" SERIAL NOT NULL,
    "grade_id" INTEGER NOT NULL,
    "previous_score" INTEGER NOT NULL,
    "new_score" INTEGER NOT NULL,
    "reason" TEXT,
    "updated_by_instructor_id" INTEGER,
    "updated_by_assistant_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grade_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinics" (
    "id" SERIAL NOT NULL,
    "lecture_id" INTEGER NOT NULL,
    "exam_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "deadline" TIMESTAMP(3),

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_targets" (
    "id" SERIAL NOT NULL,
    "clinic_id" INTEGER NOT NULL,
    "enrollment_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notification_status" TEXT NOT NULL DEFAULT 'READY',
    "memo" TEXT,

    CONSTRAINT "clinic_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" SERIAL NOT NULL,
    "instructor_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "linked_exam_id" INTEGER,
    "linked_clinic_id" INTEGER,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" SERIAL NOT NULL,
    "lecture_id" INTEGER NOT NULL,
    "uploader_instructor_id" INTEGER,
    "uploader_assistant_id" INTEGER,
    "title" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ETC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_posts" (
    "id" SERIAL NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'LECTURE',
    "target_role" TEXT NOT NULL DEFAULT 'ALL',
    "is_important" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instructor_id" INTEGER NOT NULL,
    "lecture_id" INTEGER,
    "author_assistant_id" INTEGER,

    CONSTRAINT "instructor_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_post_targets" (
    "instructor_post_id" INTEGER NOT NULL,
    "enrollment_id" INTEGER NOT NULL,

    CONSTRAINT "instructor_post_targets_pkey" PRIMARY KEY ("instructor_post_id","enrollment_id")
);

-- CreateTable
CREATE TABLE "instructor_post_attachments" (
    "instructor_post_id" INTEGER NOT NULL,
    "material_id" INTEGER NOT NULL,

    CONSTRAINT "instructor_post_attachments_pkey" PRIMARY KEY ("instructor_post_id","material_id")
);

-- CreateTable
CREATE TABLE "student_posts" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enrollment_id" INTEGER NOT NULL,
    "author_role" TEXT NOT NULL DEFAULT 'STUDENT',
    "instructor_id" INTEGER NOT NULL,
    "lecture_id" INTEGER,

    CONSTRAINT "student_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instructor_post_id" INTEGER,
    "student_post_id" INTEGER,
    "instructor_id" INTEGER,
    "assistant_id" INTEGER,
    "enrollment_id" INTEGER,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_students_email_key" ON "app_students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "app_students_phone_number_key" ON "app_students"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "app_parents_email_key" ON "app_parents"("email");

-- CreateIndex
CREATE UNIQUE INDEX "app_parents_phone_number_key" ON "app_parents"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "ParentChildLink_appParentId_phoneNumber_key" ON "ParentChildLink"("appParentId", "phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "instructors_email_key" ON "instructors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "assistants_email_key" ON "assistants"("email");

-- CreateIndex
CREATE INDEX "assistants_instructor_id_idx" ON "assistants"("instructor_id");

-- CreateIndex
CREATE INDEX "assistant_codes_instructor_id_idx" ON "assistant_codes"("instructor_id");

-- CreateIndex
CREATE INDEX "lectures_instructor_id_idx" ON "lectures"("instructor_id");

-- CreateIndex
CREATE INDEX "enrollments_app_student_id_idx" ON "enrollments"("app_student_id");

-- CreateIndex
CREATE INDEX "enrollments_student_phone_idx" ON "enrollments"("student_phone");

-- CreateIndex
CREATE INDEX "enrollments_parent_phone_idx" ON "enrollments"("parent_phone");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_lecture_id_id_key" ON "enrollments"("lecture_id", "id");

-- CreateIndex
CREATE INDEX "attendances_date_status_idx" ON "attendances"("date", "status");

-- CreateIndex
CREATE INDEX "attendances_enrollment_id_idx" ON "attendances"("enrollment_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_enrollment_id_date_key" ON "attendances"("enrollment_id", "date");

-- CreateIndex
CREATE INDEX "exams_lecture_id_idx" ON "exams"("lecture_id");

-- CreateIndex
CREATE UNIQUE INDEX "exams_lecture_id_id_key" ON "exams"("lecture_id", "id");

-- CreateIndex
CREATE INDEX "questions_exam_id_question_number_idx" ON "questions"("exam_id", "question_number");

-- CreateIndex
CREATE UNIQUE INDEX "questions_lecture_id_id_key" ON "questions"("lecture_id", "id");

-- CreateIndex
CREATE INDEX "student_answers_question_id_idx" ON "student_answers"("question_id");

-- CreateIndex
CREATE INDEX "student_answers_lecture_id_idx" ON "student_answers"("lecture_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_answers_enrollment_id_question_id_key" ON "student_answers"("enrollment_id", "question_id");

-- CreateIndex
CREATE INDEX "grades_exam_id_score_idx" ON "grades"("exam_id", "score" DESC);

-- CreateIndex
CREATE INDEX "grades_enrollment_id_idx" ON "grades"("enrollment_id");

-- CreateIndex
CREATE UNIQUE INDEX "grades_exam_id_enrollment_id_key" ON "grades"("exam_id", "enrollment_id");

-- CreateIndex
CREATE INDEX "grade_logs_grade_id_idx" ON "grade_logs"("grade_id");

-- CreateIndex
CREATE INDEX "clinics_exam_id_idx" ON "clinics"("exam_id");

-- CreateIndex
CREATE INDEX "clinic_targets_clinic_id_status_idx" ON "clinic_targets"("clinic_id", "status");

-- CreateIndex
CREATE INDEX "clinic_targets_enrollment_id_idx" ON "clinic_targets"("enrollment_id");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_targets_clinic_id_enrollment_id_key" ON "clinic_targets"("clinic_id", "enrollment_id");

-- CreateIndex
CREATE UNIQUE INDEX "schedules_linked_exam_id_key" ON "schedules"("linked_exam_id");

-- CreateIndex
CREATE UNIQUE INDEX "schedules_linked_clinic_id_key" ON "schedules"("linked_clinic_id");

-- CreateIndex
CREATE INDEX "schedules_instructor_id_start_time_idx" ON "schedules"("instructor_id", "start_time");

-- CreateIndex
CREATE INDEX "materials_lecture_id_idx" ON "materials"("lecture_id");

-- CreateIndex
CREATE INDEX "instructor_posts_lecture_id_created_at_idx" ON "instructor_posts"("lecture_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "instructor_posts_instructor_id_idx" ON "instructor_posts"("instructor_id");

-- CreateIndex
CREATE INDEX "instructor_post_targets_enrollment_id_idx" ON "instructor_post_targets"("enrollment_id");

-- CreateIndex
CREATE INDEX "student_posts_instructor_id_status_idx" ON "student_posts"("instructor_id", "status");

-- CreateIndex
CREATE INDEX "student_posts_lecture_id_created_at_idx" ON "student_posts"("lecture_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "comments_instructor_post_id_idx" ON "comments"("instructor_post_id");

-- CreateIndex
CREATE INDEX "comments_student_post_id_idx" ON "comments"("student_post_id");

-- AddForeignKey
ALTER TABLE "ParentChildLink" ADD CONSTRAINT "ParentChildLink_appParentId_fkey" FOREIGN KEY ("appParentId") REFERENCES "app_parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistants" ADD CONSTRAINT "assistants_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_codes" ADD CONSTRAINT "assistant_codes_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lectures" ADD CONSTRAINT "lectures_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_lecture_id_fkey" FOREIGN KEY ("lecture_id") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_app_student_id_fkey" FOREIGN KEY ("app_student_id") REFERENCES "app_students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_app_parent_link_id_fkey" FOREIGN KEY ("app_parent_link_id") REFERENCES "ParentChildLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_lecture_id_fkey" FOREIGN KEY ("lecture_id") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_lecture_id_exam_id_fkey" FOREIGN KEY ("lecture_id", "exam_id") REFERENCES "exams"("lecture_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_lecture_id_enrollment_id_fkey" FOREIGN KEY ("lecture_id", "enrollment_id") REFERENCES "enrollments"("lecture_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_lecture_id_question_id_fkey" FOREIGN KEY ("lecture_id", "question_id") REFERENCES "questions"("lecture_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_lecture_id_exam_id_fkey" FOREIGN KEY ("lecture_id", "exam_id") REFERENCES "exams"("lecture_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_lecture_id_enrollment_id_fkey" FOREIGN KEY ("lecture_id", "enrollment_id") REFERENCES "enrollments"("lecture_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_logs" ADD CONSTRAINT "grade_logs_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_logs" ADD CONSTRAINT "grade_logs_updated_by_instructor_id_fkey" FOREIGN KEY ("updated_by_instructor_id") REFERENCES "instructors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_logs" ADD CONSTRAINT "grade_logs_updated_by_assistant_id_fkey" FOREIGN KEY ("updated_by_assistant_id") REFERENCES "assistants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinics" ADD CONSTRAINT "clinics_lecture_id_fkey" FOREIGN KEY ("lecture_id") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinics" ADD CONSTRAINT "clinics_lecture_id_exam_id_fkey" FOREIGN KEY ("lecture_id", "exam_id") REFERENCES "exams"("lecture_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_targets" ADD CONSTRAINT "clinic_targets_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_targets" ADD CONSTRAINT "clinic_targets_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_linked_exam_id_fkey" FOREIGN KEY ("linked_exam_id") REFERENCES "exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_linked_clinic_id_fkey" FOREIGN KEY ("linked_clinic_id") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_lecture_id_fkey" FOREIGN KEY ("lecture_id") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_uploader_instructor_id_fkey" FOREIGN KEY ("uploader_instructor_id") REFERENCES "instructors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_uploader_assistant_id_fkey" FOREIGN KEY ("uploader_assistant_id") REFERENCES "assistants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_posts" ADD CONSTRAINT "instructor_posts_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_posts" ADD CONSTRAINT "instructor_posts_lecture_id_fkey" FOREIGN KEY ("lecture_id") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_posts" ADD CONSTRAINT "instructor_posts_author_assistant_id_fkey" FOREIGN KEY ("author_assistant_id") REFERENCES "assistants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_post_targets" ADD CONSTRAINT "instructor_post_targets_instructor_post_id_fkey" FOREIGN KEY ("instructor_post_id") REFERENCES "instructor_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_post_targets" ADD CONSTRAINT "instructor_post_targets_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_post_attachments" ADD CONSTRAINT "instructor_post_attachments_instructor_post_id_fkey" FOREIGN KEY ("instructor_post_id") REFERENCES "instructor_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_post_attachments" ADD CONSTRAINT "instructor_post_attachments_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_posts" ADD CONSTRAINT "student_posts_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_posts" ADD CONSTRAINT "student_posts_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_posts" ADD CONSTRAINT "student_posts_lecture_id_fkey" FOREIGN KEY ("lecture_id") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_instructor_post_id_fkey" FOREIGN KEY ("instructor_post_id") REFERENCES "instructor_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_student_post_id_fkey" FOREIGN KEY ("student_post_id") REFERENCES "student_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "assistants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
