// 생성자에서 prisma를 주입받아서 사용
import { prisma } from './db.config.js';
import { InstructorRepository } from '../repos/instructor.repo.js';
import { StudentRepository } from '../repos/student.repo.js';
import { AssistantRepository } from '../repos/assistant.repo.js';
import { ParentRepository } from '../repos/parent.repo.js';
import { AssistantCodeRepository } from '../repos/assistant-code.repo.js';
import { AuthService } from '../services/auth.service.js';
import { AuthController } from '../controllers/auth.controller.js';
import { LecturesRepository } from '../repos/lectures.repo.js';
import { LecturesService } from '../services/lectures.service.js';
import { LecturesController } from '../controllers/lectures.controller.js';
import { EnrollmentsRepository } from '../repos/enrollments.repo.js';
import { EnrollmentsService } from '../services/enrollments.service.js';
import { EnrollmentsController } from '../controllers/enrollments.controller.js';

// 1. Instantiate Repositories
const instructorRepo = new InstructorRepository();
const studentRepo = new StudentRepository();
const assistantRepo = new AssistantRepository();
const parentRepo = new ParentRepository();
const assistantCodeRepo = new AssistantCodeRepository();

const lecturesRepo = new LecturesRepository(prisma);
const enrollmentsRepo = new EnrollmentsRepository(prisma);

// 2. Instantiate Services (Inject Repos)
const authService = new AuthService(
  instructorRepo,
  assistantRepo,
  assistantCodeRepo,
  studentRepo,
  parentRepo,
);

const lecturesService = new LecturesService(lecturesRepo, prisma);
const enrollmentsService = new EnrollmentsService(enrollmentsRepo);

// 3. Instantiate Controllers (Inject Services)
const authController = new AuthController(authService);
const lecturesController = new LecturesController(lecturesService);
const enrollmentsController = new EnrollmentsController(enrollmentsService);

// 4. Export Wired Instances (Container)
export const container = {
  authService,
  authController,
  lecturesService,
  lecturesController,
  enrollmentsService,
  enrollmentsController,
};
