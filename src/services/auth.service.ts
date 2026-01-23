import { IncomingHttpHeaders } from 'http';
import { auth } from '../config/auth.config.js';
import { prisma } from '../config/db.config.js';
import { UserType } from '../constants/auth.constant.js';
import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '../err/http.exception.js';
import { instructorRepo } from '../repos/instructor.repo.js';
import { assistantRepo } from '../repos/assistant.repo.js';
import { assistantCodeRepo } from '../repos/assistant-code.repo.js';
import { studentRepo } from '../repos/student.repo.js';
import { parentRepo } from '../repos/parent.repo.js';
import { SignUpData, AuthResponse } from '../types/auth.types.js';

export class AuthService {
  // 회원가입 (Better Auth 유저 생성 + 역할별 프로필 생성)
  async signUp(userType: UserType, data: SignUpData) {
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

    return { user, session: finalSession, profile };
  }

  // 로그인 (Better Auth API 사용)
  async signIn(email: string, password: string) {
    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    if (!result) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const { user, session, token } = result as AuthResponse;
    const finalSession = session || (token ? { token } : null);

    // 프로필 정보 함께 조회
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
    return await instructorRepo.create({
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

    const assistantCode = await assistantCodeRepo.findValidCode(
      data.signupCode,
    );
    if (!assistantCode) {
      throw new BadRequestException(
        '유효하지 않거나 만료된 조교가입코드입니다.',
      );
    }

    return await prisma.$transaction(async (tx) => {
      await assistantCodeRepo.markAsUsed(assistantCode.id, tx);
      return await assistantRepo.create(
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
    return await studentRepo.create({
      userId,
      phoneNumber: data.phoneNumber,
      school: data.school,
    });
  }

  // 학부모 프로필 생성
  private async createParent(userId: string, data: SignUpData) {
    return await parentRepo.create({
      userId,
      phoneNumber: data.phoneNumber,
    });
  }

  // ID로 프로필 조회
  private async findProfileByUserId(userType: UserType, userId: string) {
    switch (userType) {
      case UserType.INSTRUCTOR:
        return instructorRepo.findByUserId(userId);
      case UserType.ASSISTANT:
        return assistantRepo.findByUserId(userId);
      case UserType.STUDENT:
        return studentRepo.findByUserId(userId);
      case UserType.PARENT:
        return parentRepo.findByUserId(userId);
    }
  }
}

export const authService = new AuthService();
