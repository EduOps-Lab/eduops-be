import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import {
  UserType,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
} from '../constants/auth.constant.js';
import { AuthResponse } from '../types/auth.types.js';
import { UnauthorizedException } from '../err/http.exception.js';

export class AuthController {
  private handleAuthResponse(
    res: Response,
    result: AuthResponse,
    message: string,
    statusCode: number = 200,
  ) {
    const { session } = result;
    if (session?.token) {
      res.cookie(AUTH_COOKIE_NAME, session.token, AUTH_COOKIE_OPTIONS);
    }
    res.status(statusCode).json({
      message,
      user: result.user,
      profile: result.profile,
    });
  }

  // 강사 회원가입
  async instructorSignUp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.signUp(UserType.INSTRUCTOR, req.body);
      this.handleAuthResponse(res, result, '회원가입이 완료되었습니다.', 201);
    } catch (error) {
      next(error);
    }
  }

  // 조교 회원가입
  async assistantSignUp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.signUp(UserType.ASSISTANT, req.body);
      this.handleAuthResponse(res, result, '회원가입이 완료되었습니다.', 201);
    } catch (error) {
      next(error);
    }
  }

  // 학생 회원가입
  async studentSignUp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.signUp(UserType.STUDENT, req.body);
      this.handleAuthResponse(res, result, '회원가입이 완료되었습니다.', 201);
    } catch (error) {
      next(error);
    }
  }

  // 학부모 회원가입
  async parentSignUp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.signUp(UserType.PARENT, req.body);
      this.handleAuthResponse(res, result, '회원가입이 완료되었습니다.', 201);
    } catch (error) {
      next(error);
    }
  }

  // 통합 로그인
  async signIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.signIn(email, password);
      this.handleAuthResponse(res, result, '로그인 성공');
    } catch (error) {
      next(error);
    }
  }

  // 로그아웃
  async signOut(req: Request, res: Response, next: NextFunction) {
    try {
      // Better Auth는 헤더에서 세션을 파싱하므로 req.headers를 전달
      await authService.signOut(req.headers);
      res.clearCookie(AUTH_COOKIE_NAME);
      res.json({ message: '로그아웃 되었습니다.' });
    } catch (error) {
      next(error);
    }
  }

  // 세션 조회
  async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const session = await authService.getSession(req.headers);
      if (!session) {
        res.clearCookie(AUTH_COOKIE_NAME);
        throw new UnauthorizedException('인증이 필요합니다.');
      }

      res.json(session);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
