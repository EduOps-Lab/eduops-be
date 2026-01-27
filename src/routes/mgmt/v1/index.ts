import { Router } from 'express';
import { mgmtAuthRouter } from './auth.routes.js';
import { mgmtLecturesRouter } from './lectures.route.js';
import { mgmtEnrollmentsRouter } from './enrollments.route.js';

export const mgmtV1Router = Router();

// 인증 라우트
mgmtV1Router.use('/auth', mgmtAuthRouter);

// 강의 라우트
mgmtV1Router.use('/lectures', mgmtLecturesRouter);

// 수강 라우트
mgmtV1Router.use('/enrollments', mgmtEnrollmentsRouter);
