import { Router } from 'express';
import { container } from '../../../config/container.config.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import {
  createLectureSchema,
  getLecturesQuerySchema,
  lectureIdParamSchema,
  updateLectureSchema,
} from '../../../validations/lectures.validation.js';
import {
  requireAuth,
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
  requireInstructorOrAssistant,
  validate(createLectureSchema, 'body'),
  container.lecturesController.createLecture,
);

/** PATCH:강의 수정 */
mgmtLecturesRouter.patch(
  '/:id',
  requireAuth,
  requireInstructorOrAssistant,
  validate(lectureIdParamSchema, 'params'),
  validate(updateLectureSchema, 'body'),
  container.lecturesController.updateLecture,
);

/** DELETE:강의 삭제 (Soft Delete) */
mgmtLecturesRouter.delete(
  '/:id',
  requireAuth,
  requireInstructorOrAssistant,
  validate(lectureIdParamSchema, 'params'),
  container.lecturesController.deleteLecture,
);
