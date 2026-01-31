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

import { ParentChildLinkRepository } from '../repos/parent-child-link.repo.js';
import { ExamsRepository } from '../repos/exams.repo.js';

import { ParentsService } from '../services/parents.service.js';
import { PermissionService } from '../services/permission.service.js';
import { ExamsService } from '../services/exams.service.js';

import { ChildrenController } from '../controllers/children.controller.js';
import { ExamsController } from '../controllers/exams.controller.js';
import { GradesController } from '../controllers/grades.controller.js';

import { GradesRepository } from '../repos/grades.repo.js';
import { GradesService } from '../services/grades.service.js';

// 1. Instantiate Repositories
const instructorRepo = new InstructorRepository(prisma);
const studentRepo = new StudentRepository(prisma);
const assistantRepo = new AssistantRepository(prisma);
const parentRepo = new ParentRepository(prisma);
const assistantCodeRepo = new AssistantCodeRepository(prisma);
const parentChildLinkRepo = new ParentChildLinkRepository(prisma);
const examsRepo = new ExamsRepository(prisma);
const gradesRepo = new GradesRepository(prisma);

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
  enrollmentsRepo,
  auth,
  prisma,
);

const permissionService = new PermissionService(
  assistantRepo,
  parentChildLinkRepo,
);

const examsService = new ExamsService(
  examsRepo,
  lecturesRepo,
  permissionService,
  prisma,
);

const gradesService = new GradesService(
  gradesRepo,
  examsRepo,
  lecturesRepo,
  permissionService,
  prisma,
);

const lecturesService = new LecturesService(
  lecturesRepo,
  enrollmentsRepo,
  studentRepo,
  instructorRepo,
  permissionService,
  prisma,
);
const parentsService = new ParentsService(
  parentRepo,
  parentChildLinkRepo,
  enrollmentsRepo,
  permissionService,
  prisma,
);

const enrollmentsService = new EnrollmentsService(
  enrollmentsRepo,
  lecturesRepo,
  studentRepo,
  parentsService,
  permissionService,
  prisma,
);

const attendancesService = new AttendancesService(
  attendancesRepo,
  enrollmentsRepo,
  lecturesRepo,
  assistantRepo,
  parentsService,
  permissionService,
  prisma,
);

// 3. Instantiate Controllers (Inject Services)
const authController = new AuthController(authService);
const lecturesController = new LecturesController(lecturesService);
const enrollmentsController = new EnrollmentsController(enrollmentsService);
const attendancesController = new AttendancesController(attendancesService);
const childrenController = new ChildrenController(parentsService);
const examsController = new ExamsController(examsService);
const gradesController = new GradesController(gradesService);

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
  parentsService,
  // Controllers
  authController,
  lecturesController,
  enrollmentsController,
  attendancesController,
  childrenController,
  examsController,
  gradesController,
  // Middlewares
  requireAuth,
  optionalAuth,
  requireInstructor,
  requireInstructorOrAssistant,
  requireStudent,
  requireParent,
};
