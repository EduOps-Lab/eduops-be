/** Jest 글로벌 설정 파일 */

// 테스트 환경 설정
process.env.NODE_ENV = 'test';
process.env.ENVIRONMENT = 'test';

// better-auth/node mock (ESM 모듈 문제 해결)
jest.mock('better-auth/node', () => ({
  fromNodeHeaders: jest.fn((headers) => headers),
  toNodeHandler: jest.fn(),
}));

// 테스트 타임아웃 설정 (10초)
jest.setTimeout(10000);

// 콘솔 로그 억제 (필요시 주석 해제)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

beforeAll(async () => {
  // 테스트 시작 전 전역 설정
});

afterAll(async () => {
  // 테스트 종료 후 정리 작업
});
