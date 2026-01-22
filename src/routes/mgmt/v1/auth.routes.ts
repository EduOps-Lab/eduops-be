import { Router } from 'express';
import { authController } from '../../../controllers/auth.controller.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import {
  signInSchema,
  instructorSignUpSchema,
  assistantSignUpSchema,
} from '../../../validations/auth.validation.js';

export const mgmtAuthRouter = Router();

// 강사 회원가입
mgmtAuthRouter.post(
  '/instructor/signup',
  validate(instructorSignUpSchema),
  authController.instructorSignUp.bind(authController),
);

// 조교 회원가입
mgmtAuthRouter.post(
  '/assistant/signup',
  validate(assistantSignUpSchema),
  authController.assistantSignUp.bind(authController),
);

// 강사/조교 로그인
mgmtAuthRouter.post(
  '/signin',
  validate(signInSchema),
  authController.signIn.bind(authController),
);

// 강사/조교 로그아웃
mgmtAuthRouter.post('/signout', authController.signOut.bind(authController));

// 강사/조교 세션 조회
mgmtAuthRouter.get('/session', authController.getSession.bind(authController));
