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

// 1. Instantiate Repositories
const instructorRepo = new InstructorRepository(prisma);
const studentRepo = new StudentRepository(prisma);
const assistantRepo = new AssistantRepository(prisma);
const parentRepo = new ParentRepository(prisma);
const assistantCodeRepo = new AssistantCodeRepository(prisma);

// 2. Instantiate Services (Inject Repos + AuthClient + Prisma)
const authService = new AuthService(
  instructorRepo,
  assistantRepo,
  assistantCodeRepo,
  studentRepo,
  parentRepo,
  auth,
  prisma,
);

// 3. Instantiate Controllers (Inject Services)
const authController = new AuthController(authService);

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
  // Controllers
  authController,
  // Middlewares
  requireAuth,
  optionalAuth,
  requireInstructor,
  requireInstructorOrAssistant,
  requireStudent,
  requireParent,
};
