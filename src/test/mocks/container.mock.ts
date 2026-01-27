/** DI Container를 Mock하여 테스트 격리 */

// Mock getSession 함수
export const mockContainerGetSession = jest.fn();

/** Container Mock 리셋 */
export const resetContainerMock = () => {
  mockContainerGetSession.mockReset();
};
