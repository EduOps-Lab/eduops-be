import express from 'express';
import cors, { CorsOptions } from 'cors';
import { router } from './routes/index.js';
import { logger } from './middlewares/logger.js';
import { requestTimer } from './middlewares/requestTimer.js';
import { config, isDevelopment, isProduction } from './config/env.config.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { disconnectDB } from './config/db.config.js';

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// CORS 옵션 설정
const whiteList: string[] = config.FRONT_URL
  ? config.FRONT_URL.split(',').map((url) => url.trim())
  : [];

const corsOptions: CorsOptions = {
  origin: isProduction() ? whiteList : true, // 프로덕션은 화이트리스트, 개발은 모두 허용(true)
  credentials: true,
};

app.use(cors(corsOptions));

if (isDevelopment()) {
  app.use(logger);
  app.use(requestTimer);
}

app.use('/', router);

app.use(errorHandler);

const server = app.listen(config.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${config.PORT}`);
  console.log(`📦 Environment: ${config.ENVIRONMENT}`);
});

const gracefulShutdown = async () => {
  console.log('🛑 Received kill signal, shutting down gracefully');
  // 1. 새로운 요청 거부 (기존 요청은 처리)
  server.close(() => {
    console.log('🔒 HTTP server closed');
  });
  // 2. DB 연결 종료 및 프로세스 종료
  await disconnectDB();
  process.exit(0);
};

// SIGTERM: Docker, Kubernetes 등에서 컨테이너 종료 시 발생
process.on('SIGTERM', gracefulShutdown);
// SIGINT: 로컬 개발 시 Ctrl+C 누를 때 발생
process.on('SIGINT', gracefulShutdown);
