import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { UserType } from '../constants/auth.constant.js';
import { isProduction } from '../config/env.config.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction(),
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
};

export class AuthController {
  // 강사 회원가입
  async instructorSignUp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.signUp(UserType.INSTRUCTOR, req.body);
      res
        .status(201)
        .json({ message: '회원가입이 완료되었습니다.', user: result });
    } catch (error) {
      next(error);
    }
  }

  // 조교 회원가입
  async assistantSignUp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.signUp(UserType.ASSISTANT, req.body);
      res
        .status(201)
        .json({ message: '회원가입이 완료되었습니다.', user: result });
    } catch (error) {
      next(error);
    }
  }

  // 학생 회원가입
  async studentSignUp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.signUp(UserType.STUDENT, req.body);
      res
        .status(201)
        .json({ message: '회원가입이 완료되었습니다.', user: result });
    } catch (error) {
      next(error);
    }
  }

  // 학부모 회원가입
  async parentSignUp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.signUp(UserType.PARENT, req.body);
      res
        .status(201)
        .json({ message: '회원가입이 완료되었습니다.', user: result });
    } catch (error) {
      next(error);
    }
  }

  // 통합 로그인
  async signIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, userType } = req.body;
      const { user, session } = await authService.signIn(
        userType,
        email,
        password,
      );

      res.cookie('session_token', session.token, COOKIE_OPTIONS);
      res.json({ message: '로그인 성공', user });
    } catch (error) {
      next(error);
    }
  }

  // 로그아웃
  async signOut(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.session_token;
      if (token) {
        await authService.signOut(token);
      }

      res.clearCookie('session_token');
      res.json({ message: '로그아웃 되었습니다.' });
    } catch (error) {
      next(error);
    }
  }

  // 세션 조회
  async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.session_token;
      if (!token) {
        return res.status(401).json({ error: '인증이 필요합니다.' });
      }

      const session = await authService.getSession(token);
      if (!session) {
        res.clearCookie('session_token');
        return res.status(401).json({ error: '세션이 만료되었습니다.' });
      }

      res.json(session);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
