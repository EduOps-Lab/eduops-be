import type { InstructorRepository } from '../../repos/instructor.repo.js';
import type { StudentRepository } from '../../repos/student.repo.js';
import type { AssistantRepository } from '../../repos/assistant.repo.js';
import type { ParentRepository } from '../../repos/parent.repo.js';
import type { AssistantCodeRepository } from '../../repos/assistant-code.repo.js';

/** Mock InstructorRepository 생성 */
export const createMockInstructorRepository =
  (): jest.Mocked<InstructorRepository> =>
    ({
      findByUserId: jest.fn(),
      findById: jest.fn(),
      findByPhoneNumber: jest.fn(),
      create: jest.fn(),
    }) as unknown as jest.Mocked<InstructorRepository>;

/** Mock StudentRepository 생성 */
export const createMockStudentRepository = (): jest.Mocked<StudentRepository> =>
  ({
    findByUserId: jest.fn(),
    findById: jest.fn(),
    findByPhoneNumber: jest.fn(),
    create: jest.fn(),
  }) as unknown as jest.Mocked<StudentRepository>;

/** Mock AssistantRepository 생성 */
export const createMockAssistantRepository =
  (): jest.Mocked<AssistantRepository> =>
    ({
      findByUserId: jest.fn(),
      findById: jest.fn(),
      findByPhoneNumber: jest.fn(),
      create: jest.fn(),
    }) as unknown as jest.Mocked<AssistantRepository>;

/** Mock ParentRepository 생성 */
export const createMockParentRepository = (): jest.Mocked<ParentRepository> =>
  ({
    findByUserId: jest.fn(),
    findById: jest.fn(),
    findByPhoneNumber: jest.fn(),
    create: jest.fn(),
  }) as unknown as jest.Mocked<ParentRepository>;

/** Mock AssistantCodeRepository 생성 */
export const createMockAssistantCodeRepository =
  (): jest.Mocked<AssistantCodeRepository> =>
    ({
      findValidCode: jest.fn(),
      markAsUsed: jest.fn(),
    }) as unknown as jest.Mocked<AssistantCodeRepository>;
