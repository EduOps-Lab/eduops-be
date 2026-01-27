import type { AuthService } from '../../services/auth.service.js';

/** Mock AuthService 생성 */
export const createMockAuthService = (): jest.Mocked<AuthService> =>
  ({
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
  }) as unknown as jest.Mocked<AuthService>;
