import express from 'express';
import lecturesRouter from './mgmt/v1/lectures.route.js';
import enrollmentsRouter from './svc/v1/enrollments.route.js';

export const router = express.Router();

// 기본 라우트
router.get('/', (req, res) => {
  console.log('GET / 요청이 라우터에 도달했습니다.');
  res.json({
    message: 'Hello Express!',
    timestamp: new Date().toISOString(),
  });
});

// API 라우트 등록
router.use('/api/mgmt/v1/lectures', lecturesRouter);
router.use('/api/svc/v1/enrollments', enrollmentsRouter);

export default router;
