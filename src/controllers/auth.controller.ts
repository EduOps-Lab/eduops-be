import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { UserType } from '../constants/auth.constant.js';
import { AuthResponse } from '../types/auth.types.js';
import { UnauthorizedException } from '../err/http.exception.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private handleAuthResponse(
    res: Response,
    result: AuthResponse,
    message: string,
    statusCode: number = 200,
    _rememberMe: boolean = false,
  ) {
    // Better Auth Handler로부터 받은 쿠키가 있으면 설정
    if (result.setCookie) {
      res.setHeader('Set-Cookie', result.setCookie);
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
      const result = await this.authService.signUp(
        UserType.INSTRUCTOR,
        req.body,
      );
      this.handleAuthResponse(res, result, '회원가입이 완료되었습니다.', 201);
    } catch (error) {
      next(error);
    }
  }

  // 조교 회원가입
  async assistantSignUp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.authService.signUp(
        UserType.ASSISTANT,
        req.body,
      );
      this.handleAuthResponse(res, result, '회원가입이 완료되었습니다.', 201);
    } catch (error) {
      next(error);
    }
  }

  // 학생 회원가입
  async studentSignUp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.authService.signUp(UserType.STUDENT, req.body);
      this.handleAuthResponse(res, result, '회원가입이 완료되었습니다.', 201);
    } catch (error) {
      next(error);
    }
  }

  // 학부모 회원가입
  async parentSignUp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.authService.signUp(UserType.PARENT, req.body);
      this.handleAuthResponse(res, result, '회원가입이 완료되었습니다.', 201);
    } catch (error) {
      next(error);
    }
  }

  // 통합 로그인
  async signIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, userType, rememberMe } = req.body;

      const result = await this.authService.signIn(
        email,
        password,
        userType,
        !!rememberMe,
      );

      this.handleAuthResponse(res, result, '로그인 성공', 200, !!rememberMe);
    } catch (error) {
      next(error);
    }
  }

  // 로그아웃
  async signOut(req: Request, res: Response, next: NextFunction) {
    try {
      // Better Auth는 헤더에서 세션을 파싱하므로 req.headers를 전달
      await this.authService.signOut(req.headers);
      res.json({ message: '로그아웃 되었습니다.' });
    } catch (error) {
      next(error);
    }
  }

  // 세션 조회
  async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const session = await this.authService.getSession(req.headers);
      if (!session) {
        throw new UnauthorizedException('인증이 필요합니다.');
      }

      res.json(session);
    } catch (error) {
      next(error);
    }
  }
}
