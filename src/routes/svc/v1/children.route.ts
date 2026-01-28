import { Router } from 'express';
import { container } from '../../../config/container.config.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { createChildSchema } from '../../../validations/children.validation.js';

export const svcChildrenRouter = Router();

const { requireAuth, requireParent, childrenController } = container;

// 모든 라우트에 대해 인증 및 학부모 권한 필요
svcChildrenRouter.use(requireAuth);
svcChildrenRouter.use(requireParent);

/**
 * POST /api/svc/v1/children
 * 자녀 등록 (전화번호 연동)
 */
svcChildrenRouter.post(
  '/',
  validate(createChildSchema, 'body'),
  childrenController.registerChild,
);

/**
 * GET /api/svc/v1/children
 * 자녀 목록 조회
 */
svcChildrenRouter.get('/', childrenController.getChildren);

/**
 * GET /api/svc/v1/children/:id/enrollments
 * 자녀 수강 목록 조회
 */
svcChildrenRouter.get(
  '/:id/enrollments',
  childrenController.getChildEnrollments,
);

/**
 * GET /api/svc/v1/children/:id/enrollments/:enrollmentId
 * 자녀 수강 상세 조회
 */
svcChildrenRouter.get(
  '/:id/enrollments/:enrollmentId',
  childrenController.getChildEnrollmentDetail,
);
