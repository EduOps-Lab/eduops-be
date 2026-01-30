import { Router } from 'express';
import { container } from '../../../config/container.config.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import {
  signInSchema,
  studentSignUpSchema,
  parentSignUpSchema,
} from '../../../validations/auth.validation.js';

export const svcAuthRouter = Router();

/** 학생 회원가입 */
svcAuthRouter.post(
  '/student/signup',
  validate(studentSignUpSchema),
  container.authController.studentSignUp.bind(container.authController),
);

/** 학부모 회원가입 */
svcAuthRouter.post(
  '/parent/signup',
  validate(parentSignUpSchema),
  container.authController.parentSignUp.bind(container.authController),
);

/** 학생/학부모 로그인 */
svcAuthRouter.post(
  '/signin',
  validate(signInSchema),
  container.authController.signIn.bind(container.authController),
);

/** 학생/학부모 로그아웃 */
svcAuthRouter.post(
  '/signout',
  container.authController.signOut.bind(container.authController),
);

/** 학생/학부모 세션 조회 */
svcAuthRouter.get(
  '/session',
  container.authController.getSession.bind(container.authController),
);
