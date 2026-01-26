// Auth Mock 유틸리티
export {
  MockUser,
  MockSession,
  MockProfile,
  createMockUser,
  createMockSession,
  createMockProfile,
  mockAuthMiddleware,
  createMockGetSession,
  asInstructor,
  asAssistant,
  asStudent,
  asParent,
  createMockBetterAuth,
} from './auth.mock.js';

// App Mock 유틸리티
export {
  TestAppOptions,
  createTestApp,
  createMiddlewareTestApp,
  createControllerTestApp,
} from './app.mock.js';

// Test Fixtures
export {
  mockUsers,
  mockSession,
  signUpRequests,
  signInRequests,
  mockAssistantCode,
  mockProfiles,
} from '../fixtures/index.js';

// Test Mocks
export {
  createMockInstructorRepository,
  createMockStudentRepository,
  createMockAssistantRepository,
  createMockParentRepository,
  createMockAssistantCodeRepository,
  createMockAuthService,
  mockSignUpEmail,
  mockSignInEmail,
  mockSignOut,
  mockGetSession,
  mockUserFindUnique,
  mockUserDelete,
  mockTransaction,
  createMockPrisma,
  resetBetterAuthMock,
  resetPrismaMock,
} from '../mocks/index.js';
