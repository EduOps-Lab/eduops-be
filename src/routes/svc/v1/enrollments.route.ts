import { Router } from 'express';
import { container } from '../../../config/container.config.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import {
  getEnrollmentsQuerySchema,
  enrollmentIdParamSchema,
  getEnrollmentDetailQuerySchema,
} from '../../../validations/enrollments.validation.js';

export const svcEnrollmentsRouter = Router();

/** GET: 수강 목록 조회 */
svcEnrollmentsRouter.get(
  '/',
  validate(getEnrollmentsQuerySchema, 'query'),
  container.enrollmentsController.getEnrollments,
);

/** GET: 수강 상세 조회 */
svcEnrollmentsRouter.get(
  '/:enrollmentId',
  validate(enrollmentIdParamSchema, 'params'),
  validate(getEnrollmentDetailQuerySchema, 'query'),
  container.enrollmentsController.getEnrollment,
);
