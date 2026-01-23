import express from 'express';
import { toNodeHandler } from 'better-auth/node';
import { mgmtV1Router } from './mgmt/v1/index.js';
import { svcV1Router } from './svc/v1/index.js';
import { auth } from '../config/auth.config.js';

export const router = express.Router();

// Better Auth 핸들러 마운트
router.use('/api/auth', toNodeHandler(auth));

// 기본 라우트
router.get('/', (req, res) => {
  console.log('GET / 요청이 라우터에 도달했습니다.');
  res.json({
    message: 'Hello Express!',
    timestamp: new Date().toISOString(),
  });
});

// 강사/조교용 API (Management)
router.use('/api/mgmt/v1', mgmtV1Router);

// 학생/학부모용 API (Service)
router.use('/api/svc/v1', svcV1Router);

export default router;
