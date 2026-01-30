import { Router } from 'express';
import { container } from '../../../config/container.config.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import {
  examIdParamSchema,
  updateExamSchema,
} from '../../../validations/exams.validation.js';

export const mgmtExamsRouter = Router();

const { requireAuth, requireInstructorOrAssistant, examsController } =
  container;

/** 모든 라우트에 대해 강사/조교 권한 필요 */
mgmtExamsRouter.use(requireAuth);
mgmtExamsRouter.use(requireInstructorOrAssistant);

/** 시험 상세 조회 (questions 포함) */
mgmtExamsRouter.get(
  '/:examId',
  validate(examIdParamSchema, 'params'),
  examsController.getExam,
);

/** 시험 수정 (문항 Upsert 포함) */
mgmtExamsRouter.patch(
  '/:examId',
  validate(examIdParamSchema, 'params'),
  validate(updateExamSchema, 'body'),
  examsController.updateExam,
);
