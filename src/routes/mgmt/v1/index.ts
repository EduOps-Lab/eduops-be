import { Router } from 'express';
import { mgmtAuthRouter } from './auth.routes.js';
import { mgmtLecturesRouter } from './lectures.route.js';

export const mgmtV1Router = Router();

// 인증 라우트
mgmtV1Router.use('/auth', mgmtAuthRouter);

// 강의 라우트
mgmtV1Router.use('/lectures', mgmtLecturesRouter);
