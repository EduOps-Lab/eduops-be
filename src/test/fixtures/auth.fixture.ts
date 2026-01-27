import { UserType } from '../../constants/auth.constant.js';

/** Mock Session 데이터 */
export const mockSession = {
  id: 'test-session-id',
  userId: 'test-user-id',
  token: 'test-session-token',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  ipAddress: '127.0.0.1',
  userAgent: 'jest-test',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
} as const;

/** 회원가입 요청 데이터 */
export const signUpRequests = {
  instructor: {
    email: 'new-instructor@example.com',
    password: 'password123!',
    name: 'New Instructor',
    phoneNumber: '010-1111-2222',
    subject: 'Mathematics',
    academy: 'Test Academy',
  },
  assistant: {
    email: 'new-assistant@example.com',
    password: 'password123!',
    name: 'New Assistant',
    phoneNumber: '010-2222-3333',
    signupCode: 'VALID-CODE-123',
  },
  student: {
    email: 'new-student@example.com',
    password: 'password123!',
    name: 'New Student',
    phoneNumber: '010-3333-4444',
    school: 'Test High School',
    schoolYear: '2',
  },
  parent: {
    email: 'new-parent@example.com',
    password: 'password123!',
    userType: UserType.PARENT,
    name: 'New Parent',
    phoneNumber: '010-4444-5555',
  },
} as const;

/** 로그인 요청 데이터 */
export const signInRequests = {
  instructor: {
    email: 'instructor@example.com',
    password: 'password123!',
    userType: UserType.INSTRUCTOR,
    rememberMe: false,
  },
  student: {
    email: 'student@example.com',
    password: 'password123!',
    userType: UserType.STUDENT,
    rememberMe: true,
  },
} as const;

/** 조교 코드 Mock 데이터 */
export const mockAssistantCode = {
  id: 'assistant-code-id',
  code: 'VALID-CODE-123',
  instructorId: 'instructor-id-123',
  isUsed: false,
  expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
  createdAt: new Date(),
} as const;
