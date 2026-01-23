import { Router } from 'express';
import { LecturesController } from '../../../controllers/lectures.controller.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import {
  createLectureSchema,
  getLecturesQuerySchema,
  lectureIdParamSchema,
  updateLectureSchema,
  deleteLectureSchema,
} from '../../../validations/lectures.validation.js';
import { prisma } from '../../../config/db.config.js';
import { LecturesRepository } from '../../../repos/lectures.repo.js';
import { LecturesService } from '../../../services/lectures.service.js';

const router = Router();

const lectureRepository = new LecturesRepository(prisma);
const lecturesService = new LecturesService(lectureRepository);
const lecturesController = new LecturesController(lecturesService);

// /api/mgmt/v1/lectures 강사/조교

/** GET:강의 리스트 조회 */
router.get(
  '/',
  validate(getLecturesQuerySchema, 'query'),
  lecturesController.getLectures,
);

/** GET:강의 개별 조회 */
router.get(
  '/:id',
  validate(lectureIdParamSchema, 'params'),
  lecturesController.getLecture,
);

/** POST:강의 생성 */
router.post(
  '/',
  validate(createLectureSchema, 'body'),
  lecturesController.createLecture,
);

/** PATCH:강의 수정 */
router.patch(
  '/:id',
  validate(lectureIdParamSchema, 'params'),
  validate(updateLectureSchema, 'body'),
  lecturesController.updateLecture,
);

/** DELETE:강의 삭제 (Soft Delete) */
router.delete(
  '/:id',
  validate(lectureIdParamSchema, 'params'),
  validate(deleteLectureSchema, 'body'),
  lecturesController.deleteLecture,
);

export default router;
