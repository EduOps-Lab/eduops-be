import { Router } from 'express';
import { svcAuthRouter } from './auth.routes.js';

export const svcV1Router = Router();

// 인증 라우트
svcV1Router.use('/auth', svcAuthRouter);
