import { Router } from 'express';
import { container } from '../../../config/container.config.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import {
  enrollmentIdParamSchema,
  getSvcEnrollmentsQuerySchema,
} from '../../../validations/enrollments.validation.js';

export const svcEnrollmentsRouter = Router();

const { requireAuth, requireStudent, enrollmentsController } = container;

// ---------- 로그인한 사용자 ----------

/** GET: 수강 목록 조회 */
svcEnrollmentsRouter.get(
  '/',
  requireAuth,
  requireAuth,
  requireStudent,
  validate(getSvcEnrollmentsQuerySchema, 'query'),
  enrollmentsController.getEnrollments,
);

/** GET: 수강 상세 조회 */
svcEnrollmentsRouter.get(
  '/:enrollmentId',
  requireAuth,
  requireStudent,
  validate(enrollmentIdParamSchema, 'params'),
  enrollmentsController.getEnrollment,
);
