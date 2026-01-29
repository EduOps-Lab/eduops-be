import { Router } from 'express';
import { container } from '../../../config/container.config.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import {
  createLectureSchema,
  getLecturesQuerySchema,
  lectureIdParamSchema,
  updateLectureSchema,
} from '../../../validations/lectures.validation.js';
import { createEnrollmentSchema } from '../../../validations/enrollments.validation.js';
import { createBulkAttendancesSchema } from '../../../validations/attendances.validation.js';

export const mgmtLecturesRouter = Router();

const {
  requireAuth,
  requireInstructor,
  requireInstructorOrAssistant,
  lecturesController,
} = container;

// 모든 라우트에 대해 강사/조교 권한 필요
mgmtLecturesRouter.use(requireAuth);
mgmtLecturesRouter.use(requireInstructorOrAssistant);

/** GET:강의 리스트 조회 */
mgmtLecturesRouter.get(
  '/',
  validate(getLecturesQuerySchema, 'query'),
  lecturesController.getLectures,
);

/** GET:강의 개별 조회 */
mgmtLecturesRouter.get(
  '/:id',
  validate(lectureIdParamSchema, 'params'),
  lecturesController.getLecture,
);

/** POST:강의 생성 */
mgmtLecturesRouter.post(
  '/',
  validate(createLectureSchema, 'body'),
  lecturesController.createLecture,
);

/** PATCH:강의 수정 */
mgmtLecturesRouter.patch(
  '/:id',
  validate(lectureIdParamSchema, 'params'),
  validate(updateLectureSchema, 'body'),
  lecturesController.updateLecture,
);

/** DELETE:강의 삭제 (Soft Delete) */
mgmtLecturesRouter.delete(
  '/:id',
  requireInstructor,
  validate(lectureIdParamSchema, 'params'),
  lecturesController.deleteLecture,
);

// --- Enrollments (Nested Routes) ---

/**
 * GET /api/mgmt/v1/lectures/:lectureId/enrollments
 * 해당 강의의 수강생 목록 조회
 */
mgmtLecturesRouter.get(
  '/:lectureId/enrollments',
  container.enrollmentsController.getEnrollmentsByLecture,
);

/**
 * POST /api/mgmt/v1/lectures/:lectureId/enrollments
 * 해당 강의에 수강생 등록
 */
mgmtLecturesRouter.post(
  '/:lectureId/enrollments',
  validate(createEnrollmentSchema, 'body'),
  container.enrollmentsController.createEnrollment,
);

/**
 * POST /api/mgmt/v1/lectures/:lectureId/enrollments/attendances
 * 해당 강의 수강생 단체 출결 등록
 */
mgmtLecturesRouter.post(
  '/:lectureId/enrollments/attendances',
  validate(createBulkAttendancesSchema, 'body'),
  container.attendancesController.createBulkAttendances,
);
