import { Router } from 'express';
import { authController } from '../../../controllers/auth.controller.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import {
  signInSchema,
  studentSignUpSchema,
  parentSignUpSchema,
} from '../../../validations/auth.validation.js';

export const svcAuthRouter = Router();

// 학생 회원가입
svcAuthRouter.post(
  '/student/signup',
  validate(studentSignUpSchema),
  authController.studentSignUp.bind(authController),
);

// 학부모 회원가입
svcAuthRouter.post(
  '/parent/signup',
  validate(parentSignUpSchema),
  authController.parentSignUp.bind(authController),
);

// 학생/학부모 로그인
svcAuthRouter.post(
  '/signin',
  validate(signInSchema),
  authController.signIn.bind(authController),
);

// 학생/학부모 로그아웃
svcAuthRouter.post('/signout', authController.signOut.bind(authController));

// 학생/학부모 세션 조회
svcAuthRouter.get('/session', authController.getSession.bind(authController));
