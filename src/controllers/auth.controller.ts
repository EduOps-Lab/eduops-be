import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { AUTH_COOKIE_NAME, UserType } from '../constants/auth.constant.js';
import { UnauthorizedException } from '../err/http.exception.js';
import { successResponse } from '../utils/response.util.js';
import { AuthResponse } from '../types/auth.types.js';
import { isProduction } from '../config/env.config.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private handleAuthResponse = (
    res: Response,
    result: AuthResponse,
    message: string,
    statusCode: number = 200,
  ) => {
    // Better Auth Handler로부터 받은 쿠키가 있으면 설정
    if (result.setCookie) {
      res.setHeader('Set-Cookie', result.setCookie);
    }

    return successResponse(res, {
      statusCode,
      message,
      data: {
        user: result.user,
        profile: result.profile,
      },
    });
  };

  private clearSessionCookie = (res: Response) => {
    res.cookie(AUTH_COOKIE_NAME, '', {
      httpOnly: true,
      secure: isProduction(),
      sameSite: 'lax',
      path: '/',
      expires: new Date(0), // 1970년으로 설정하여 즉시 삭제 유도
    });
  };

  /** 강사 회원가입 */
  instructorSignUp = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const result = await this.authService.signUp(
        UserType.INSTRUCTOR,
        req.body,
      );
      this.handleAuthResponse(res, result, '회원가입이 완료되었습니다.', 201);
    } catch (error) {
      next(error);
    }
  };

  /** 조교 회원가입 */
  assistantSignUp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.signUp(
        UserType.ASSISTANT,
        req.body,
      );
      this.handleAuthResponse(res, result, '회원가입이 완료되었습니다.', 201);
    } catch (error) {
      next(error);
    }
  };

  /** 학생 회원가입 */
  studentSignUp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.signUp(UserType.STUDENT, req.body);
      this.handleAuthResponse(res, result, '회원가입이 완료되었습니다.', 201);
    } catch (error) {
      next(error);
    }
  };

  /** 학부모 회원가입 */
  parentSignUp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.signUp(UserType.PARENT, req.body);
      this.handleAuthResponse(res, result, '회원가입이 완료되었습니다.', 201);
    } catch (error) {
      next(error);
    }
  };

  /** 통합 로그인 */
  signIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, userType, rememberMe } = req.body;

      const result = await this.authService.signIn(
        email,
        password,
        userType,
        !!rememberMe,
      );

      this.handleAuthResponse(res, result, '로그인 성공', 200);
    } catch (error) {
      next(error);
    }
  };

  /** 로그아웃 */
  signOut = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Better Auth는 헤더에서 세션을 파싱하므로 req.headers를 전달
      await this.authService.signOut(req.headers);
      this.clearSessionCookie(res);
      return successResponse(res, { message: '로그아웃 되었습니다.' });
    } catch (error) {
      next(error);
    }
  };

  /** 세션 조회 */
  getSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await this.authService.getSession(req.headers);
      if (!session) {
        throw new UnauthorizedException('인증이 필요합니다.');
      }

      return successResponse(res, { data: session });
    } catch (error) {
      // 세션 조회에 실패한 모든 경우(세션 없음, DB 오류 등)에
      // 클라이언트의 쿠키를 정리해주는 것이 안전합니다.
      this.clearSessionCookie(res);
      next(error);
    }
  };
}
