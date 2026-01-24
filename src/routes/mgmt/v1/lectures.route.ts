import { Router } from 'express';
import { container } from '../../../config/container.config.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import {
  createLectureSchema,
  getLecturesQuerySchema,
  lectureIdParamSchema,
  updateLectureSchema,
  deleteLectureSchema,
} from '../../../validations/lectures.validation.js';

export const mgmtLecturesRouter = Router();

/** GET:강의 리스트 조회 */
mgmtLecturesRouter.get(
  '/',
  validate(getLecturesQuerySchema, 'query'),
  container.lecturesController.getLectures,
);

/** GET:강의 개별 조회 */
mgmtLecturesRouter.get(
  '/:id',
  validate(lectureIdParamSchema, 'params'),
  container.lecturesController.getLecture,
);

/** POST:강의 생성 */
mgmtLecturesRouter.post(
  '/',
  validate(createLectureSchema, 'body'),
  container.lecturesController.createLecture,
);

/** PATCH:강의 수정 */
mgmtLecturesRouter.patch(
  '/:id',
  validate(lectureIdParamSchema, 'params'),
  validate(updateLectureSchema, 'body'),
  container.lecturesController.updateLecture,
);

/** DELETE:강의 삭제 (Soft Delete) */
mgmtLecturesRouter.delete(
  '/:id',
  validate(lectureIdParamSchema, 'params'),
  validate(deleteLectureSchema, 'body'),
  container.lecturesController.deleteLecture,
);
