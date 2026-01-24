import { IncomingHttpHeaders } from 'http';
import { auth } from '../config/auth.config.js';
import { prisma } from '../config/db.config.js';
import { UserType } from '../constants/auth.constant.js';
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
} from '../err/http.exception.js';
import { InstructorRepository } from '../repos/instructor.repo.js';
import { AssistantRepository } from '../repos/assistant.repo.js';
import { AssistantCodeRepository } from '../repos/assistant-code.repo.js';
import { StudentRepository } from '../repos/student.repo.js';
import { ParentRepository } from '../repos/parent.repo.js';
import { SignUpData, AuthResponse } from '../types/auth.types.js';

export class AuthService {
  constructor(
    private readonly instructorRepo: InstructorRepository,
    private readonly assistantRepo: AssistantRepository,
    private readonly assistantCodeRepo: AssistantCodeRepository,
    private readonly studentRepo: StudentRepository,
    private readonly parentRepo: ParentRepository,
  ) {}

  // 회원가입 (Better Auth 유저 생성 + 역할별 프로필 생성)
  async signUp(userType: UserType, data: SignUpData) {
    const existingProfile = await this.findProfileByPhoneNumber(
      userType,
      data.phoneNumber,
    );

    if (existingProfile) {
      throw new BadRequestException('이미 가입된 전화번호입니다.');
    }

    const result = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.name || data.email,
        userType: userType,
      },
    });

    if (!result) {
      throw new InternalServerErrorException('회원가입에 실패했습니다.');
    }

    // result의 타입을 명시적으로 캐스팅하여 속성 접근
    const { user, session, token } = result as AuthResponse;
    const finalSession = session || (token ? { token } : null);
    const userId = user.id;

    let profile;
    try {
      switch (userType) {
        case UserType.INSTRUCTOR:
          profile = await this.createInstructor(userId, data);
          break;
        case UserType.ASSISTANT:
          profile = await this.createAssistant(userId, data);
          break;
        case UserType.STUDENT:
          profile = await this.createStudent(userId, data);
          break;
        case UserType.PARENT:
          profile = await this.createParent(userId, data);
          break;
      }
    } catch (error) {
      // 프로필 생성 실패 시 유저 정보 롤백 (삭제)
      // Cascade 설정에 의해 Session, Account 등도 함께 삭제됨
      await prisma.user.delete({
        where: { id: userId },
      });
      throw error;
    }

    return { user, session: finalSession, profile };
  }

  // 로그인 (Better Auth API 사용)
  async signIn(
    email: string,
    password: string,
    requiredUserType: UserType,
    rememberMe: boolean = false,
  ) {
    // 1. 이메일로 유저 조회하여 타입 검증 먼저 수행
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (
      existingUser &&
      (existingUser.userType as UserType) !== requiredUserType
    ) {
      throw new ForbiddenException('유저 역할이 잘못되었습니다.');
    }

    // 2. Better Auth로 로그인 시도 (이메일, 비밀번호만 사용)
    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
        rememberMe,
      },
    });

    if (!result) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const { user, session, token } = result as AuthResponse;

    const finalSession = session || (token ? { token } : null);

    // 3. 프로필 정보 함께 조회
    const profile = await this.findProfileByUserId(
      user.userType as UserType,
      user.id,
    );

    return {
      user,
      session: finalSession,
      profile,
    };
  }

  // 로그아웃 (핸들러에서 처리하거나 API 호출)
  async signOut(headers: IncomingHttpHeaders) {
    return await auth.api.signOut({
      headers: headers as Record<string, string>,
    });
  }

  // 세션 조회
  async getSession(headers: IncomingHttpHeaders) {
    const session = (await auth.api.getSession({
      headers: headers as Record<string, string>,
    })) as AuthResponse | null;

    if (!session) return null;

    const profile = await this.findProfileByUserId(
      session.user.userType as UserType,
      session.user.id,
    );

    return {
      ...session,
      profile,
    };
  }

  // 강사 프로필 생성
  private async createInstructor(userId: string, data: SignUpData) {
    return await this.instructorRepo.create({
      userId,
      phoneNumber: data.phoneNumber,
      subject: data.subject,
      academy: data.academy,
    });
  }

  // 조교 프로필 생성
  private async createAssistant(userId: string, data: SignUpData) {
    if (!data.signupCode) {
      throw new BadRequestException('조교가입코드가 필요합니다.');
    }

    const assistantCode = await this.assistantCodeRepo.findValidCode(
      data.signupCode,
    );
    if (!assistantCode) {
      throw new BadRequestException(
        '유효하지 않거나 만료된 조교가입코드입니다.',
      );
    }

    return await prisma.$transaction(async (tx) => {
      await this.assistantCodeRepo.markAsUsed(assistantCode.id, tx);
      return await this.assistantRepo.create(
        {
          userId,
          phoneNumber: data.phoneNumber,
          instructorId: assistantCode.instructorId,
          signupCode: data.signupCode!,
        },
        tx,
      );
    });
  }

  // 학생 프로필 생성
  private async createStudent(userId: string, data: SignUpData) {
    return await this.studentRepo.create({
      userId,
      phoneNumber: data.phoneNumber,
      school: data.school,
    });
  }

  // 학부모 프로필 생성
  private async createParent(userId: string, data: SignUpData) {
    return await this.parentRepo.create({
      userId,
      phoneNumber: data.phoneNumber,
    });
  }

  // ID로 프로필 조회
  private async findProfileByUserId(userType: UserType, userId: string) {
    switch (userType) {
      case UserType.INSTRUCTOR:
        return this.instructorRepo.findByUserId(userId);
      case UserType.ASSISTANT:
        return this.assistantRepo.findByUserId(userId);
      case UserType.STUDENT:
        return this.studentRepo.findByUserId(userId);
      case UserType.PARENT:
        return this.parentRepo.findByUserId(userId);
    }
  }

  // 전화번호로 프로필 조회
  private async findProfileByPhoneNumber(
    userType: UserType,
    phoneNumber: string,
  ) {
    switch (userType) {
      case UserType.INSTRUCTOR:
        return this.instructorRepo.findByPhoneNumber(phoneNumber);
      case UserType.ASSISTANT:
        return this.assistantRepo.findByPhoneNumber(phoneNumber);
      case UserType.STUDENT:
        return this.studentRepo.findByPhoneNumber(phoneNumber);
      case UserType.PARENT:
        return this.parentRepo.findByPhoneNumber(phoneNumber);
    }
  }
}
