import type { InstructorRepository } from '../../repos/instructor.repo.js';
import type { StudentRepository } from '../../repos/student.repo.js';
import type { AssistantRepository } from '../../repos/assistant.repo.js';
import type { ParentRepository } from '../../repos/parent.repo.js';
import type { AssistantCodeRepository } from '../../repos/assistant-code.repo.js';
import type { LecturesRepository } from '../../repos/lectures.repo.js';
import type { EnrollmentsRepository } from '../../repos/enrollments.repo.js';
import { createAutoMock } from './create-mock.util.js';

/** Mock InstructorRepository 생성 */
export const createMockInstructorRepository = () =>
  createAutoMock<InstructorRepository>([
    'findByUserId',
    'findById',
    'findByPhoneNumber',
    'create',
  ]);

/** Mock StudentRepository 생성 */
export const createMockStudentRepository = () =>
  createAutoMock<StudentRepository>([
    'findByUserId',
    'findById',
    'findByPhoneNumber',
    'create',
  ]);

/** Mock AssistantRepository 생성 */
export const createMockAssistantRepository = () =>
  createAutoMock<AssistantRepository>([
    'findByUserId',
    'findById',
    'findByPhoneNumber',
    'create',
  ]);

/** Mock ParentRepository 생성 */
export const createMockParentRepository = () =>
  createAutoMock<ParentRepository>([
    'findByUserId',
    'findById',
    'findByPhoneNumber',
    'create',
  ]);

/** Mock AssistantCodeRepository 생성 */
export const createMockAssistantCodeRepository = () =>
  createAutoMock<AssistantCodeRepository>(['findValidCode', 'markAsUsed']);

/** Mock LecturesRepository 생성 */
export const createMockLecturesRepository = () =>
  createAutoMock<LecturesRepository>([
    'create',
    'findById',
    'findInstructorById',
    'findByIdWithRelations',
    'findMany',
    'update',
    'softDelete',
  ]);

/** Mock EnrollmentsRepository 생성 */
export const createMockEnrollmentsRepository = () =>
  createAutoMock<EnrollmentsRepository>([
    'createMany',
    'create',
    'findById',
    'findByIdWithRelations',
    'findByAppStudentId',
    'findByAppParentLinkId',
    'findByAppParentId',
    'findManyByLectureId',
    'findManyByInstructorId',
    'findParentIdByParentChildLinkId',
    'update',
    'softDelete',
  ]);
