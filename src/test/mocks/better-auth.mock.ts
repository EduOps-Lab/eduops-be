/** Better-Auth Mock 객체 생성 */
export const createMockBetterAuth = () => ({
  api: {
    signUpEmail: jest.fn(),
    signInEmail: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
  },
});

/** Better-Auth Mock 타입 */
export type MockBetterAuth = ReturnType<typeof createMockBetterAuth>;
