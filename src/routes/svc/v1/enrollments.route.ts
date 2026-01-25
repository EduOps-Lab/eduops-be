import { Router } from 'express';
import { container } from '../../../config/container.config.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { enrollmentIdParamSchema } from '../../../validations/enrollments.validation.js';
import {
  requireAuth,
  requireStudent,
} from '../../../middlewares/auth.middleware.js';

export const svcEnrollmentsRouter = Router();

/** GET: 수강 목록 조회 */
svcEnrollmentsRouter.get(
  '/',
  requireAuth,
  requireStudent,
  container.enrollmentsController.getEnrollments,
);

/** GET: 수강 상세 조회 */
svcEnrollmentsRouter.get(
  '/:enrollmentId',
  requireAuth,
  requireStudent,
  validate(enrollmentIdParamSchema, 'params'),
  container.enrollmentsController.getEnrollment,
);
