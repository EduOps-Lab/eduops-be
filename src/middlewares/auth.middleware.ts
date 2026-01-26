import { Request, Response, NextFunction } from 'express';
import { container } from '../config/container.config.js';
import { UserType } from '../constants/auth.constant.js';
import { AuthSession } from '../types/auth.types.js';
import {
  UnauthorizedException,
  ForbiddenException,
} from '../err/http.exception.js';

// Request 타입 확장
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        userType: UserType;
        name: string;
        image?: string | null;
      };
      profile?: unknown;
      authSession?: AuthSession | { token: string } | null;
    }
  }
}

// 인증 필수 미들웨어
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const result = await container.authService.getSession(req.headers);

  if (!result) {
    throw new UnauthorizedException('인증이 필요합니다.');
  }

  req.user = {
    ...result.user,
    userType: result.user.userType as UserType,
  };
  req.authSession = result.session;
  req.profile = result.profile;

  next();
}

// 특정 userType만 허용
export function requireUserType(...allowedTypes: UserType[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedException('인증이 필요합니다.'));
    }

    if (!allowedTypes.includes(req.user.userType)) {
      return next(new ForbiddenException('접근 권한이 없습니다.'));
    }

    next();
  };
}

// 강사 전용
export const requireInstructor = requireUserType(UserType.INSTRUCTOR);

// 강사 또는 조교
export const requireInstructorOrAssistant = requireUserType(
  UserType.INSTRUCTOR,
  UserType.ASSISTANT,
);

// 학생 전용
export const requireStudent = requireUserType(UserType.STUDENT);

// 학부모 전용
export const requireParent = requireUserType(UserType.PARENT);

// 선택적 인증 (로그인 안 해도 통과, 로그인 시 user 정보 추가)
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await container.authService.getSession(req.headers);
    if (result) {
      req.user = {
        ...result.user,
        userType: result.user.userType as UserType,
      };
      req.authSession = result.session;
      req.profile = result.profile;
    }
    next();
  } catch (_error) {
    next();
  }
}
