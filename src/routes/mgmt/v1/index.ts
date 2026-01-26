import { Router } from 'express';
import { mgmtAuthRouter } from './auth.routes.js';

export const mgmtV1Router = Router();

// 인증 라우트
mgmtV1Router.use('/auth', mgmtAuthRouter);
