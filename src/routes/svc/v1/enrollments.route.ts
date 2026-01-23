import { Router } from 'express';
import { EnrollmentsController } from '../../../controllers/enrollments.controller.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import {
  getEnrollmentsQuerySchema,
  enrollmentIdParamSchema,
  getEnrollmentDetailQuerySchema,
} from '../../../validations/enrollments.validation.js';
import { prisma } from '../../../config/db.config.js';
import { EnrollmentsRepository } from '../../../repos/enrollments.repo.js';
import { EnrollmentsService } from '../../../services/enrollments.service.js';

const router = Router();

const enrollmentRepository = new EnrollmentsRepository(prisma);
const enrollmentsService = new EnrollmentsService(enrollmentRepository);
const enrollmentsController = new EnrollmentsController(enrollmentsService);

// /api/svc/v1/enrollments 학생/학부모

/** GET: 수강 목록 조회 */
router.get(
  '/',
  validate(getEnrollmentsQuerySchema, 'query'),
  enrollmentsController.getEnrollments,
);

/** GET: 수강 상세 조회 */
router.get(
  '/:enrollmentId',
  validate(enrollmentIdParamSchema, 'params'),
  validate(getEnrollmentDetailQuerySchema, 'query'),
  enrollmentsController.getEnrollment,
);

export default router;
