// Mock 함수들
export const mockSignUpEmail = jest.fn();
export const mockSignInEmail = jest.fn();
export const mockSignOut = jest.fn();
export const mockGetSession = jest.fn();

/** Better-Auth Mock 리셋 */
export const resetBetterAuthMock = () => {
  mockSignUpEmail.mockReset();
  mockSignInEmail.mockReset();
  mockSignOut.mockReset();
  mockGetSession.mockReset();
};
