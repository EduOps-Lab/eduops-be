import { Router } from 'express';
import { container } from '../../../config/container.config.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import {
  confirmPhoneVerificationSchema,
  enrollmentIdParamSchema,
  getEnrollmentDetailByPhoneQuerySchema,
  getEnrollmentsByPhoneQuerySchema,
  requestPhoneVerificationSchema,
} from '../../../validations/enrollments.validation.js';
import {
  optionalAuth,
  requireAuth,
  requireStudent,
} from '../../../middlewares/auth.middleware.js';

export const svcEnrollmentsRouter = Router();

// ---------- 로그인한 사용자 ----------

/** GET: 수강 목록 조회 */
svcEnrollmentsRouter.get(
  '/',
  requireAuth,
  requireStudent,
  container.enrollmentsController.getEnrollments,
);

/** GET:  전화번호로 수강 상세 조회 (임시 토큰 필요)*/
svcEnrollmentsRouter.get(
  '/phone/:enrollmentId',
  optionalAuth,
  validate(enrollmentIdParamSchema, 'params'),
  validate(getEnrollmentDetailByPhoneQuerySchema, 'query'),
  container.enrollmentsController.getEnrollmentByPhone,
);

/** GET: 수강 상세 조회 */
svcEnrollmentsRouter.get(
  '/:enrollmentId',
  requireAuth,
  requireStudent,
  validate(enrollmentIdParamSchema, 'params'),
  container.enrollmentsController.getEnrollment,
);

// 전화번호 기반 조회 (미가입 사용자) - 아직 제대로 프로토타입

/** POST 전화번호로 인증 코드 요청 */
svcEnrollmentsRouter.post(
  '/verify/phone/request',
  validate(requestPhoneVerificationSchema, 'body'),
  container.enrollmentsController.requestPhoneVerification,
);

/** POST 전화번호로 인증 코드 검증 */
svcEnrollmentsRouter.post(
  '/verify/phone/confirm',
  validate(confirmPhoneVerificationSchema, 'body'),
  container.enrollmentsController.confirmPhoneVerification,
);

/** GET:  전화번호로 수강 목록 조회 (임시 토큰 필요)*/
svcEnrollmentsRouter.get(
  '/phone',
  optionalAuth,
  validate(getEnrollmentsByPhoneQuerySchema, 'query'),
  container.enrollmentsController.getEnrollmentsByPhone,
);
