import { prisma } from './db.config.js';
import { auth } from './auth.config.js';
import { InstructorRepository } from '../repos/instructor.repo.js';
import { StudentRepository } from '../repos/student.repo.js';
import { AssistantRepository } from '../repos/assistant.repo.js';
import { ParentRepository } from '../repos/parent.repo.js';
import { AssistantCodeRepository } from '../repos/assistant-code.repo.js';
import { AuthService } from '../services/auth.service.js';
import { AuthController } from '../controllers/auth.controller.js';
import {
  createRequireAuth,
  createOptionalAuth,
  createRoleMiddlewares,
} from '../middlewares/auth.middleware.js';
import { LecturesRepository } from '../repos/lectures.repo.js';
import { LecturesService } from '../services/lectures.service.js';
import { LecturesController } from '../controllers/lectures.controller.js';
import { EnrollmentsRepository } from '../repos/enrollments.repo.js';
import { EnrollmentsService } from '../services/enrollments.service.js';
import { EnrollmentsController } from '../controllers/enrollments.controller.js';
import { AttendancesRepository } from '../repos/attendances.repo.js';
import { AttendancesService } from '../services/attendances.service.js';
import { AttendancesController } from '../controllers/attendances.controller.js';

// 1. Instantiate Repositories
const instructorRepo = new InstructorRepository(prisma);
const studentRepo = new StudentRepository(prisma);
const assistantRepo = new AssistantRepository(prisma);
const parentRepo = new ParentRepository(prisma);
const assistantCodeRepo = new AssistantCodeRepository(prisma);

const lecturesRepo = new LecturesRepository(prisma);
const enrollmentsRepo = new EnrollmentsRepository(prisma);
const attendancesRepo = new AttendancesRepository(prisma);

// 2. Instantiate Services (Inject Repos)
const authService = new AuthService(
  instructorRepo,
  assistantRepo,
  assistantCodeRepo,
  studentRepo,
  parentRepo,
  auth,
  prisma,
);

const lecturesService = new LecturesService(
  lecturesRepo,
  enrollmentsRepo,
  prisma,
);
const enrollmentsService = new EnrollmentsService(
  enrollmentsRepo,
  lecturesRepo,
  assistantRepo,
  prisma,
);

const attendancesService = new AttendancesService(
  attendancesRepo,
  enrollmentsRepo,
  lecturesRepo,
  assistantRepo,
  prisma,
);

// 3. Instantiate Controllers (Inject Services)
const authController = new AuthController(authService);
const lecturesController = new LecturesController(lecturesService);
const enrollmentsController = new EnrollmentsController(enrollmentsService);
const attendancesController = new AttendancesController(attendancesService);

// 4. Create Middlewares (Inject Services)
const requireAuth = createRequireAuth(authService);
const optionalAuth = createOptionalAuth(authService);
const {
  requireInstructor,
  requireInstructorOrAssistant,
  requireStudent,
  requireParent,
} = createRoleMiddlewares();

// 5. Export Wired Instances (Container)
export const container = {
  // Services
  authService,
  lecturesService,
  enrollmentsService,
  attendancesService,
  // Controllers
  authController,
  lecturesController,
  enrollmentsController,
  attendancesController,
  // Middlewares
  requireAuth,
  optionalAuth,
  requireInstructor,
  requireInstructorOrAssistant,
  requireStudent,
  requireParent,
};
