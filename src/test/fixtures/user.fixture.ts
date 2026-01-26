import { UserType } from '../../constants/auth.constant.js';

/** Mock User 데이터 */
export const mockUsers = {
  instructor: {
    id: 'test-instructor-id',
    email: 'instructor@example.com',
    name: 'Test Instructor',
    userType: UserType.INSTRUCTOR,
  },
  assistant: {
    id: 'test-assistant-id',
    email: 'assistant@example.com',
    name: 'Test Assistant',
    userType: UserType.ASSISTANT,
  },
  student: {
    id: 'test-student-id',
    email: 'student@example.com',
    name: 'Test Student',
    userType: UserType.STUDENT,
  },
  parent: {
    id: 'test-parent-id',
    email: 'parent@example.com',
    name: 'Test Parent',
    userType: UserType.PARENT,
  },
} as const;
