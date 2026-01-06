import express from 'express';
export const router = express.Router();

// 기본 라우트
router.get('/', (req, res) => {
  console.log('GET / 요청이 라우터에 도달했습니다.');
  res.json({
    message: 'Hello Express!',
    timestamp: new Date().toISOString(),
  });
});

export default router;
