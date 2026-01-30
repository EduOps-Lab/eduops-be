import { Router } from 'express';
import { mgmtAuthRouter } from './auth.routes.js';
import { mgmtLecturesRouter } from './lectures.route.js';
import { mgmtEnrollmentsRouter } from './enrollments.route.js';

export const mgmtV1Router = Router();

/** 인증 라우트 */
mgmtV1Router.use('/auth', mgmtAuthRouter);

/** 강의 라우트 */
mgmtV1Router.use('/lectures', mgmtLecturesRouter);

/** 수강 라우트 */
mgmtV1Router.use('/enrollments', mgmtEnrollmentsRouter);

/** 시험 라우트 */
import { mgmtExamsRouter } from './exams.route.js';
mgmtV1Router.use('/exams', mgmtExamsRouter);
