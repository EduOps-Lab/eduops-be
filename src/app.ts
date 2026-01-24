import express from 'express';
import cors, { CorsOptions } from 'cors';
import cookieParser from 'cookie-parser';
import { router } from './routes/index.js';
import { logger } from './middlewares/logger.middleware.js';
import { requestTimer } from './middlewares/reqtimer.middleware.js';
import { config, isDevelopment, isProduction } from './config/env.config.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { disconnectDB } from './config/db.config.js';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './config/auth.config.js';

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

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

app.all('/api/auth/', toNodeHandler(auth));

app.use('/', router);

app.use(errorHandler);

const server = app.listen(config.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${config.PORT}`);
  console.log(`📦 Environment: ${config.ENVIRONMENT}`);
});

const gracefulShutdown = async () => {
  console.log('🛑 Received kill signal, shutting down gracefully');

  // 1. 새로운 요청 거부 및 기존 요청 처리 완료 대기 (Promise로 래핑)
  const closeServer = new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err) {
        console.error('❌ Error closing server:', err);
        return reject(err);
      }
      console.log('🔒 HTTP server closed');
      resolve();
    });
  });

  try {
    // 서버가 닫힐 때까지 기다림 (기존 요청 처리 완료 보장)
    await closeServer;

    // 2. 그 후 DB 연결 종료
    await disconnectDB();
    console.log('👋 Bye');

    process.exit(0);
  } catch (error) {
    console.error('💥 Error during shutdown:', error);
    process.exit(1);
  }
};

// SIGTERM: Docker, Kubernetes 등에서 컨테이너 종료 시 발생
process.on('SIGTERM', gracefulShutdown);
// SIGINT: 로컬 개발 시 Ctrl+C 누를 때 발생
process.on('SIGINT', gracefulShutdown);
