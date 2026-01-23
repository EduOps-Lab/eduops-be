import { Router } from 'express';
import { LecturesController } from '../../../../controllers/lectures.controller.js';
import { validate } from '../../../../middlewares/validate.middleware.js';
import {
  createLectureSchema,
  getLecturesQuerySchema,
  lectureIdParamSchema,
  updateLectureSchema,
  deleteLectureSchema,
} from '../../../../validations/lectures.validation.js';

const router = Router();
const lecturesController = new LecturesController();

// /api/mgmt/v1/lectures

/** GET:강의 리스트 조회 */
router.get(
  '/',
  validate(getLecturesQuerySchema, 'query'),
  lecturesController.list,
);

/** GET:강의 개별 조회 */
router.get(
  '/:id',
  validate(lectureIdParamSchema, 'params'),
  lecturesController.getById,
);

/** POST:강의 생성 */
router.post(
  '/',
  validate(createLectureSchema, 'body'),
  lecturesController.create,
);

/** PATCH:강의 수정 */
router.patch(
  '/:id',
  validate(lectureIdParamSchema, 'params'),
  validate(updateLectureSchema, 'body'),
  lecturesController.update,
);

/** DELETE:강의 삭제 (Soft Delete) */
router.delete(
  '/:id',
  validate(lectureIdParamSchema, 'params'),
  validate(deleteLectureSchema, 'body'),
  lecturesController.delete,
);

export default router;
