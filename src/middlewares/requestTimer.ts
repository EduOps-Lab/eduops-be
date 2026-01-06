import { RequestHandler } from 'express';

declare global {
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
}

export const requestTimer: RequestHandler = (req, res, next) => {
  req.startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - (req.startTime || 0);
    console.log(`요청 처리 시간: ${duration}ms`);
  });
  next();
};
