import { AuthService } from './auth.service.js';
import { UserType } from '../constants/auth.constant.js';
import {
  BadRequestException,
  ForbiddenException,
} from '../err/http.exception.js';
import {
  createMockInstructorRepository,
  createMockStudentRepository,
  createMockAssistantRepository,
  createMockParentRepository,
  createMockAssistantCodeRepository,
  createMockPrisma,
  mockSignUpEmail,
  mockSignInEmail,
  mockSignOut,
  mockGetSession,
  mockUserFindUnique,
  mockUserDelete,
  mockTransaction,
} from '../test/mocks/index.js';
import {
  mockUsers,
  mockSession,
  signUpRequests,
  mockProfiles,
  mockAssistantCode,
} from '../test/fixtures/index.js';
import { PrismaClient } from '../generated/prisma/client.js';

// better-auth Mock 설정
jest.mock('../config/auth.config', () => ({
  auth: {
    api: {
      signUpEmail: (...args: unknown[]) => mockSignUpEmail(...args),
      signInEmail: (...args: unknown[]) => mockSignInEmail(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

// prisma Mock 설정
jest.mock('../config/db.config', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      delete: (...args: unknown[]) => mockUserDelete(...args),
    },
    $transaction: (fn: (tx: unknown) => Promise<unknown>) =>
      mockTransaction(fn),
  },
}));

describe('AuthService', () => {
  // Mock Dependencies
  let mockInstructorRepo: ReturnType<typeof createMockInstructorRepository>;
  let mockAssistantRepo: ReturnType<typeof createMockAssistantRepository>;
  let mockAssistantCodeRepo: ReturnType<
    typeof createMockAssistantCodeRepository
  >;
  let mockStudentRepo: ReturnType<typeof createMockStudentRepository>;
  let mockParentRepo: ReturnType<typeof createMockParentRepository>;
  let mockPrisma: PrismaClient;

  // Service under test
  let authService: AuthService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock dependencies
    mockInstructorRepo = createMockInstructorRepository();
    mockAssistantRepo = createMockAssistantRepository();
    mockAssistantCodeRepo = createMockAssistantCodeRepository();
    mockStudentRepo = createMockStudentRepository();
    mockParentRepo = createMockParentRepository();
    mockPrisma = createMockPrisma() as unknown as PrismaClient;

    // Create AuthService with mocked dependencies (DI)
    authService = new AuthService(
      mockInstructorRepo,
      mockAssistantRepo,
      mockAssistantCodeRepo,
      mockStudentRepo,
      mockParentRepo,
      mockPrisma,
    );
  });

  // ============================================
  // [인증 (Login)] 테스트 케이스
  // ============================================

  describe('[인증] signUp', () => {
    describe('AUTH-01: 강사 회원가입', () => {
      it('강사 회원가입이 성공적으로 완료된다', async () => {
        // Arrange
        mockInstructorRepo.findByPhoneNumber.mockResolvedValue(null);
        mockInstructorRepo.create.mockResolvedValue(mockProfiles.instructor);
        mockSignUpEmail.mockResolvedValue({
          user: mockUsers.instructor,
          session: mockSession,
        });

        // Act
        const result = await authService.signUp(
          UserType.INSTRUCTOR,
          signUpRequests.instructor,
        );

        // Assert
        expect(result.user).toEqual(mockUsers.instructor);
        expect(result.session).toEqual(mockSession);
        expect(mockInstructorRepo.findByPhoneNumber).toHaveBeenCalledWith(
          signUpRequests.instructor.phoneNumber,
        );
        expect(mockSignUpEmail).toHaveBeenCalledWith({
          body: {
            email: signUpRequests.instructor.email,
            password: signUpRequests.instructor.password,
            name: signUpRequests.instructor.name,
            userType: UserType.INSTRUCTOR,
          },
        });
      });

      it('이미 가입된 전화번호로 회원가입 시 BadRequestException 발생', async () => {
        // Arrange
        mockInstructorRepo.findByPhoneNumber.mockResolvedValue(
          mockProfiles.instructor,
        );

        // Act & Assert
        await expect(
          authService.signUp(UserType.INSTRUCTOR, signUpRequests.instructor),
        ).rejects.toThrow(BadRequestException);
        await expect(
          authService.signUp(UserType.INSTRUCTOR, signUpRequests.instructor),
        ).rejects.toThrow('이미 가입된 전화번호입니다.');
      });
    });

    describe('AUTH-02: 조교 회원가입 (조교 코드 검증)', () => {
      it('유효한 조교 코드로 회원가입이 성공한다', async () => {
        // Arrange
        mockAssistantRepo.findByPhoneNumber.mockResolvedValue(null);
        mockAssistantCodeRepo.findValidCode.mockResolvedValue(
          mockAssistantCode,
        );
        mockAssistantCodeRepo.markAsUsed.mockResolvedValue(mockAssistantCode);
        mockAssistantRepo.create.mockResolvedValue(mockProfiles.assistant);

        mockSignUpEmail.mockResolvedValue({
          user: mockUsers.assistant,
          session: mockSession,
        });

        mockTransaction.mockImplementation(async (fn) => fn({}));

        // Act
        const result = await authService.signUp(
          UserType.ASSISTANT,
          signUpRequests.assistant,
        );

        // Assert
        expect(result.user.userType).toBe(UserType.ASSISTANT);
        expect(mockAssistantCodeRepo.findValidCode).toHaveBeenCalledWith(
          signUpRequests.assistant.signupCode,
        );
      });

      it('조교 코드 없이 회원가입 시 BadRequestException 발생', async () => {
        // Arrange
        const dataWithoutCode = {
          ...signUpRequests.assistant,
          signupCode: undefined,
        };
        mockAssistantRepo.findByPhoneNumber.mockResolvedValue(null);
        mockSignUpEmail.mockResolvedValue({
          user: mockUsers.assistant,
          session: mockSession,
        });

        // Act & Assert
        await expect(
          authService.signUp(UserType.ASSISTANT, dataWithoutCode),
        ).rejects.toThrow(BadRequestException);
      });

      it('유효하지 않은 조교 코드 사용 시 BadRequestException 발생', async () => {
        // Arrange
        mockAssistantRepo.findByPhoneNumber.mockResolvedValue(null);
        mockAssistantCodeRepo.findValidCode.mockResolvedValue(null);
        mockSignUpEmail.mockResolvedValue({
          user: mockUsers.assistant,
          session: mockSession,
        });

        // Act & Assert
        await expect(
          authService.signUp(UserType.ASSISTANT, signUpRequests.assistant),
        ).rejects.toThrow(BadRequestException);
        await expect(
          authService.signUp(UserType.ASSISTANT, signUpRequests.assistant),
        ).rejects.toThrow('유효하지 않거나 만료된 조교가입코드입니다.');
      });
    });

    describe('AUTH-03: 학생 회원가입', () => {
      it('학생 회원가입이 성공적으로 완료된다', async () => {
        // Arrange
        mockStudentRepo.findByPhoneNumber.mockResolvedValue(null);
        mockStudentRepo.create.mockResolvedValue(mockProfiles.student);

        mockSignUpEmail.mockResolvedValue({
          user: mockUsers.student,
          session: mockSession,
        });

        // Act
        const result = await authService.signUp(
          UserType.STUDENT,
          signUpRequests.student,
        );

        // Assert
        expect(result.user.userType).toBe(UserType.STUDENT);
        expect(mockStudentRepo.create).toHaveBeenCalled();
      });
    });

    describe('AUTH-04: 학부모 회원가입', () => {
      it('학부모 회원가입이 성공적으로 완료된다', async () => {
        // Arrange
        mockParentRepo.findByPhoneNumber.mockResolvedValue(null);
        mockParentRepo.create.mockResolvedValue(mockProfiles.parent);

        mockSignUpEmail.mockResolvedValue({
          user: mockUsers.parent,
          session: mockSession,
        });

        // Act
        const result = await authService.signUp(
          UserType.PARENT,
          signUpRequests.parent,
        );

        // Assert
        expect(result.user.userType).toBe(UserType.PARENT);
        expect(mockParentRepo.create).toHaveBeenCalled();
      });
    });
  });

  describe('[인증] signIn', () => {
    describe('AUTH-05: 로그인 성공', () => {
      it('올바른 자격 증명으로 로그인 성공', async () => {
        // Arrange
        mockUserFindUnique.mockResolvedValue({
          id: mockUsers.instructor.id,
          email: mockUsers.instructor.email,
          userType: UserType.INSTRUCTOR,
        });

        mockSignInEmail.mockResolvedValue({
          user: mockUsers.instructor,
          session: mockSession,
        });

        mockInstructorRepo.findByUserId.mockResolvedValue(
          mockProfiles.instructor,
        );

        // Act
        const result = await authService.signIn(
          mockUsers.instructor.email,
          'password123',
          UserType.INSTRUCTOR,
          false,
        );

        // Assert
        expect(result.user).toEqual(mockUsers.instructor);
        expect(result.session).toEqual(mockSession);
        expect(result.profile).toEqual(mockProfiles.instructor);
      });
    });

    describe('AUTH-08: userType 불일치 로그인', () => {
      it('다른 역할로 로그인 시도 시 ForbiddenException 발생', async () => {
        // Arrange - 강사로 가입된 유저가 학생으로 로그인 시도
        mockUserFindUnique.mockResolvedValue({
          id: mockUsers.instructor.id,
          email: mockUsers.instructor.email,
          userType: UserType.INSTRUCTOR,
        });

        // Act & Assert
        await expect(
          authService.signIn(
            mockUsers.instructor.email,
            'password123',
            UserType.STUDENT,
            false,
          ),
        ).rejects.toThrow(ForbiddenException);
        await expect(
          authService.signIn(
            mockUsers.instructor.email,
            'password123',
            UserType.STUDENT,
            false,
          ),
        ).rejects.toThrow('유저 역할이 잘못되었습니다.');
      });
    });
  });

  describe('[인증] getSession', () => {
    describe('AUTH-07: 세션 조회', () => {
      it('유효한 세션 조회 시 사용자 및 프로필 정보 반환', async () => {
        // Arrange
        const headers = { cookie: 'session_token=test-token' };

        mockGetSession.mockResolvedValue({
          user: mockUsers.instructor,
          session: mockSession,
        });

        mockInstructorRepo.findByUserId.mockResolvedValue(
          mockProfiles.instructor,
        );

        // Act
        const result = await authService.getSession(headers);

        // Assert
        expect(result).not.toBeNull();
        expect(result?.user).toEqual(mockUsers.instructor);
        expect(result?.profile).toEqual(mockProfiles.instructor);
      });

      it('유효하지 않은 세션 시 null 반환', async () => {
        // Arrange
        const headers = {};
        mockGetSession.mockResolvedValue(null);

        // Act
        const result = await authService.getSession(headers);

        // Assert
        expect(result).toBeNull();
      });
    });
  });

  describe('[인증] signOut', () => {
    describe('AUTH-06: 로그아웃', () => {
      it('로그아웃 시 better-auth API 호출', async () => {
        // Arrange
        const headers = { cookie: 'session_token=test-token' };
        mockSignOut.mockResolvedValue({ success: true });

        // Act
        await authService.signOut(headers);

        // Assert
        expect(mockSignOut).toHaveBeenCalledWith({
          headers: headers,
        });
      });
    });
  });

  // ============================================
  // [권한 (RBAC)] 테스트 케이스 - Service Layer
  // ============================================

  describe('[권한] 역할별 프로필 조회', () => {
    describe('RBAC-U01: 강사 프로필 조회', () => {
      it('강사 세션에서 강사 프로필 조회', async () => {
        // Arrange
        mockGetSession.mockResolvedValue({
          user: mockUsers.instructor,
          session: mockSession,
        });
        mockInstructorRepo.findByUserId.mockResolvedValue(
          mockProfiles.instructor,
        );

        // Act
        const result = await authService.getSession({});

        // Assert
        expect(mockInstructorRepo.findByUserId).toHaveBeenCalledWith(
          mockUsers.instructor.id,
        );
        expect(result?.profile).toEqual(mockProfiles.instructor);
      });
    });

    describe('RBAC-U02: 조교 프로필 조회', () => {
      it('조교 세션에서 조교 프로필 조회', async () => {
        // Arrange
        mockGetSession.mockResolvedValue({
          user: mockUsers.assistant,
          session: mockSession,
        });
        mockAssistantRepo.findByUserId.mockResolvedValue(
          mockProfiles.assistant,
        );

        // Act
        const result = await authService.getSession({});

        // Assert
        expect(mockAssistantRepo.findByUserId).toHaveBeenCalledWith(
          mockUsers.assistant.id,
        );
        expect(result?.profile).toEqual(mockProfiles.assistant);
      });
    });

    describe('RBAC-U03: 학생/학부모 프로필 분리 조회', () => {
      it('학생 세션에서 학생 프로필 조회', async () => {
        // Arrange
        mockGetSession.mockResolvedValue({
          user: mockUsers.student,
          session: mockSession,
        });
        mockStudentRepo.findByUserId.mockResolvedValue(mockProfiles.student);

        // Act
        const result = await authService.getSession({});

        // Assert
        expect(mockStudentRepo.findByUserId).toHaveBeenCalledWith(
          mockUsers.student.id,
        );
        expect(result?.profile).toEqual(mockProfiles.student);
      });

      it('학부모 세션에서 학부모 프로필 조회', async () => {
        // Arrange
        mockGetSession.mockResolvedValue({
          user: mockUsers.parent,
          session: mockSession,
        });
        mockParentRepo.findByUserId.mockResolvedValue(mockProfiles.parent);

        // Act
        const result = await authService.getSession({});

        // Assert
        expect(mockParentRepo.findByUserId).toHaveBeenCalledWith(
          mockUsers.parent.id,
        );
        expect(result?.profile).toEqual(mockProfiles.parent);
      });
    });
  });

  // ============================================
  // [예외 케이스] 테스트
  // ============================================

  describe('[예외] 에러 핸들링', () => {
    describe('ERR-01: 프로필 생성 실패 시 롤백', () => {
      it('프로필 생성 실패 시 유저 정보 롤백', async () => {
        // Arrange
        mockInstructorRepo.findByPhoneNumber.mockResolvedValue(null);
        mockInstructorRepo.create.mockRejectedValue(
          new Error('Profile creation failed'),
        );

        mockSignUpEmail.mockResolvedValue({
          user: mockUsers.instructor,
          session: mockSession,
        });

        // Act & Assert
        await expect(
          authService.signUp(UserType.INSTRUCTOR, signUpRequests.instructor),
        ).rejects.toThrow('Profile creation failed');

        // 롤백 확인
        expect(mockUserDelete).toHaveBeenCalledWith({
          where: { id: mockUsers.instructor.id },
        });
      });
    });
  });
});
