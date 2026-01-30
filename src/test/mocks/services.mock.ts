import type { AuthService } from '../../services/auth.service.js';
import type { ParentsService } from '../../services/parents.service.js';

/** Mock AuthService 생성 */
export const createMockAuthService = (): jest.Mocked<AuthService> =>
  ({
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
  }) as unknown as jest.Mocked<AuthService>;

/** Mock ParentsService 생성 */
export const createMockParentsService = (): jest.Mocked<ParentsService> =>
  ({
    registerChild: jest.fn(),
    getChildren: jest.fn(),
    getChildEnrollments: jest.fn(),
    getChildEnrollmentDetail: jest.fn(),
    findLinkByPhoneNumber: jest.fn(),
    validateChildAccess: jest.fn(),
  }) as unknown as jest.Mocked<ParentsService>;
