import { Router } from 'express';
import { LecturesController } from '../../../../controllers/lectures.controller.js';
import { validate } from '../../../../middlewares/validate.middleware.js';
import { createLectureSchema } from '../../../../validations/lectures.validation.js';

const router = Router();
const lecturesController = new LecturesController();

// /api/mgmt/v1/lectures

/** POST:강의 생성 */
router.post(
  '/',
  validate(createLectureSchema, 'body'),
  lecturesController.create,
);

export default router;
