import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../config/db.config.js';
import { UserType } from '../constants/auth.constant.js';
import { HttpException } from '../err/http.exception.js';
import { instructorRepo } from '../repos/instructor.repo.js';
import { assistantRepo } from '../repos/assistant.repo.js';
import { assistantCodeRepo } from '../repos/assistant-code.repo.js';
import { studentRepo } from '../repos/student.repo.js';
import { parentRepo } from '../repos/parent.repo.js';
import { sessionRepo } from '../repos/session.repo.js';

const SALT_ROUNDS = 12;
const SESSION_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7일

interface SignUpData {
  email: string;
  password: string;
  name?: string;
  phoneNumber: string;
  subject?: string;
  academy?: string;
  signupCode?: string;
  school?: string;
}

export class AuthService {
  // 회원가입 (userType별로 다른 테이블에 저장)
  async signUp(userType: UserType, data: SignUpData) {
    // 이메일 중복 체크
    const existingUser = await this.findUserByEmail(userType, data.email);
    if (existingUser) {
      throw new HttpException('이미 사용 중인 이메일입니다.', 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    let user;
    switch (userType) {
      case UserType.INSTRUCTOR:
        user = await this.createInstructor(data, hashedPassword);
        break;
      case UserType.ASSISTANT:
        user = await this.createAssistant(data, hashedPassword);
        break;
      case UserType.STUDENT:
        user = await this.createStudent(data, hashedPassword);
        break;
      case UserType.PARENT:
        user = await this.createParent(data, hashedPassword);
        break;
    }

    return { id: user.id, email: user.email, userType };
  }

  // 로그인 (userType으로 테이블 지정)
  async signIn(userType: UserType, email: string, password: string) {
    const user = await this.findUserByEmail(userType, email);

    if (!user) {
      throw new HttpException('이메일 또는 비밀번호가 올바르지 않습니다.', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new HttpException('이메일 또는 비밀번호가 올바르지 않습니다.', 401);
    }

    // 세션 생성
    const session = await this.createSession(user.id, userType);

    return {
      user: this.sanitizeUser(user, userType),
      session,
    };
  }

  // 로그아웃
  async signOut(token: string) {
    await sessionRepo.deleteByToken(token);
  }

  // 세션 조회
  async getSession(token: string) {
    const session = await sessionRepo.findByToken(token);

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    const user = await this.findUserById(
      session.userType as UserType,
      session.userId,
    );
    if (!user) {
      return null;
    }

    return {
      user: this.sanitizeUser(user, session.userType as UserType),
      session,
    };
  }

  // 강사 생성
  private async createInstructor(data: SignUpData, hashedPassword: string) {
    return await instructorRepo.create({
      email: data.email,
      password: hashedPassword,
      name: data.name!,
      phoneNumber: data.phoneNumber,
      subject: data.subject,
      academy: data.academy,
    });
  }

  // 조교 생성 (가입코드 검증 포함)
  private async createAssistant(data: SignUpData, hashedPassword: string) {
    // 조교가입코드 검증
    if (!data.signupCode) {
      throw new HttpException('조교가입코드가 필요합니다.', 400);
    }

    const assistantCode = await assistantCodeRepo.findValidCode(
      data.signupCode,
    );

    if (!assistantCode) {
      throw new HttpException(
        '유효하지 않거나 만료된 조교가입코드입니다.',
        400,
      );
    }

    // 조교 생성 및 코드 사용 처리 (트랜잭션)
    return await prisma.$transaction(async (tx) => {
      // 코드를 사용됨으로 표시
      await assistantCodeRepo.markAsUsed(assistantCode.id, tx);

      // 조교 생성
      return await assistantRepo.create(
        {
          email: data.email,
          password: hashedPassword,
          name: data.name!,
          phoneNumber: data.phoneNumber,
          instructorId: assistantCode.instructorId,
          signupCode: data.signupCode!, // 이미 검증됨
        },
        tx,
      );
    });
  }

  // 학생 생성
  private async createStudent(data: SignUpData, hashedPassword: string) {
    return await studentRepo.create({
      email: data.email,
      password: hashedPassword,
      name: data.name!,
      phoneNumber: data.phoneNumber,
      school: data.school,
    });
  }

  // 학부모 생성
  private async createParent(data: SignUpData, hashedPassword: string) {
    return await parentRepo.create({
      email: data.email,
      password: hashedPassword,
      phoneNumber: data.phoneNumber,
    });
  }

  // 세션 생성
  private async createSession(userId: string, userType: UserType) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_EXPIRES_IN);

    // 기존 세션이 있으면 삭제 (재로그인 지원)
    await sessionRepo.deleteByUserIdAndType(userId, userType);

    const session = await sessionRepo.create({
      userId,
      userType,
      token,
      expiresAt,
    });

    return session;
  }

  // 이메일로 사용자 조회
  private async findUserByEmail(userType: UserType, email: string) {
    switch (userType) {
      case UserType.INSTRUCTOR:
        return instructorRepo.findByEmail(email);
      case UserType.ASSISTANT:
        return assistantRepo.findByEmail(email);
      case UserType.STUDENT:
        return studentRepo.findByEmail(email);
      case UserType.PARENT:
        return parentRepo.findByEmail(email);
    }
  }

  // ID로 사용자 조회
  private async findUserById(userType: UserType, id: string) {
    switch (userType) {
      case UserType.INSTRUCTOR:
        return instructorRepo.findById(id);
      case UserType.ASSISTANT:
        return assistantRepo.findById(id);
      case UserType.STUDENT:
        return studentRepo.findById(id);
      case UserType.PARENT:
        return parentRepo.findById(id);
    }
  }

  // 민감한 정보 제거
  private sanitizeUser(
    user: {
      id: string;
      email: string;
      password: string;
      [key: string]: unknown;
    },
    userType: UserType,
  ) {
    const { password: _password, ...safeUser } = user;
    return { ...safeUser, userType };
  }
}

export const authService = new AuthService();
