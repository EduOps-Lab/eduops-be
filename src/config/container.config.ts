import { InstructorRepository } from '../repos/instructor.repo.js';
import { StudentRepository } from '../repos/student.repo.js';
import { AssistantRepository } from '../repos/assistant.repo.js';
import { ParentRepository } from '../repos/parent.repo.js';
import { AssistantCodeRepository } from '../repos/assistant-code.repo.js';
import { AuthService } from '../services/auth.service.js';
import { AuthController } from '../controllers/auth.controller.js';

// 1. Instantiate Repositories
const instructorRepo = new InstructorRepository();
const studentRepo = new StudentRepository();
const assistantRepo = new AssistantRepository();
const parentRepo = new ParentRepository();
const assistantCodeRepo = new AssistantCodeRepository();

// 2. Instantiate Services (Inject Repos)
const authService = new AuthService(
  instructorRepo,
  assistantRepo,
  assistantCodeRepo,
  studentRepo,
  parentRepo,
);

// 3. Instantiate Controllers (Inject Services)
const authController = new AuthController(authService);

// 4. Export Wired Instances (Container)
export const container = {
  authService,
  authController,
};
