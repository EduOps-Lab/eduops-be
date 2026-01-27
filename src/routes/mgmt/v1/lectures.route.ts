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
import {
  requireAuth,
  requireInstructor,
  requireInstructorOrAssistant,
} from '../../../middlewares/auth.middleware.js';

export const mgmtLecturesRouter = Router();

/** GET:강의 리스트 조회 */
mgmtLecturesRouter.get(
  '/',
  requireAuth,
  requireInstructorOrAssistant,
  validate(getLecturesQuerySchema, 'query'),
  container.lecturesController.getLectures,
);

/** GET:강의 개별 조회 */
mgmtLecturesRouter.get(
  '/:id',
  requireAuth,
  requireInstructorOrAssistant,
  validate(lectureIdParamSchema, 'params'),
  container.lecturesController.getLecture,
);

/** POST:강의 생성 */
mgmtLecturesRouter.post(
  '/',
  requireAuth,
  requireInstructor,
  validate(createLectureSchema, 'body'),
  container.lecturesController.createLecture,
);

/** PATCH:강의 수정 */
mgmtLecturesRouter.patch(
  '/:id',
  requireAuth,
  requireInstructor,
  validate(lectureIdParamSchema, 'params'),
  validate(updateLectureSchema, 'body'),
  container.lecturesController.updateLecture,
);

/** DELETE:강의 삭제 (Soft Delete) */
mgmtLecturesRouter.delete(
  '/:id',
  requireAuth,
  requireInstructor,
  validate(lectureIdParamSchema, 'params'),
  container.lecturesController.deleteLecture,
);

// --- Enrollments (Nested Routes) ---

/**
 * GET /api/mgmt/v1/lectures/:lectureId/enrollments
 * 해당 강의의 수강생 목록 조회
 */
mgmtLecturesRouter.get(
  '/:lectureId/enrollments',
  requireInstructorOrAssistant,
  container.enrollmentsController.getEnrollmentsByLecture,
);

/**
 * POST /api/mgmt/v1/lectures/:lectureId/enrollments
 * 해당 강의에 수강생 등록
 */
mgmtLecturesRouter.post(
  '/:lectureId/enrollments',
  requireInstructorOrAssistant,
  validate(createEnrollmentSchema, 'body'),
  container.enrollmentsController.createEnrollment,
);
