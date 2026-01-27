import { UserType } from '../../constants/auth.constant.js';

/** Mock User 데이터 */
export const mockUsers = {
  instructor: {
    id: 'test-instructor-id',
    email: 'instructor@example.com',
    emailVerified: false,
    name: 'Test Instructor',
    image: null,
    userType: UserType.INSTRUCTOR,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  assistant: {
    id: 'test-assistant-id',
    email: 'assistant@example.com',
    emailVerified: false,
    name: 'Test Assistant',
    image: null,
    userType: UserType.ASSISTANT,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  student: {
    id: 'test-student-id',
    email: 'student@example.com',
    emailVerified: false,
    name: 'Test Student',
    image: null,
    userType: UserType.STUDENT,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  parent: {
    id: 'test-parent-id',
    email: 'parent@example.com',
    emailVerified: false,
    name: 'Test Parent',
    image: null,
    userType: UserType.PARENT,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
} as const;
