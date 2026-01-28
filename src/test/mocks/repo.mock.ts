import type { InstructorRepository } from '../../repos/instructor.repo.js';
import type { StudentRepository } from '../../repos/student.repo.js';
import type { AssistantRepository } from '../../repos/assistant.repo.js';
import type { ParentRepository } from '../../repos/parent.repo.js';
import type { AssistantCodeRepository } from '../../repos/assistant-code.repo.js';
import type { LecturesRepository } from '../../repos/lectures.repo.js';
import type { EnrollmentsRepository } from '../../repos/enrollments.repo.js';

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

/** Mock LecturesRepository 생성 */
export const createMockLecturesRepository =
  (): jest.Mocked<LecturesRepository> =>
    ({
      create: jest.fn(),
      findById: jest.fn(),
      findInstructorById: jest.fn(),
      findByIdWithRelations: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    }) as unknown as jest.Mocked<LecturesRepository>;

/** Mock EnrollmentsRepository 생성 */
export const createMockEnrollmentsRepository =
  (): jest.Mocked<EnrollmentsRepository> =>
    ({
      createMany: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByIdWithRelations: jest.fn(),
      findByAppStudentId: jest.fn(),
      findByAppParentLinkId: jest.fn(),
      findByAppParentId: jest.fn(),
      findManyByLectureId: jest.fn(),
      findManyByInstructorId: jest.fn(),
      findParentIdByParentChildLinkId: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    }) as unknown as jest.Mocked<EnrollmentsRepository>;
