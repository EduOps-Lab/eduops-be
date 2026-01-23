import {
  HttpException,
  UnauthorizedException,
  ConflictException,
  UnprocessableEntityException,
  ForbiddenException,
} from './http.exception.js';

interface BetterAuthError {
  code?: string;
  body?: {
    code?: string;
    message?: string;
  };
  message?: string;
  statusCode?: number; // Better Auth errors often have this
  status?: string;
  [key: string]: unknown;
}

export function isBetterAuthError(error: unknown): error is BetterAuthError {
  if (typeof error !== 'object' || error === null) return false;

  const e = error as Record<string, unknown>;

  // 탑 레벨에 code가 있거나
  if ('code' in e && typeof e.code === 'string') return true;

  // body 안에 code가 있거나 (InternalAPIError 구조)
  if (
    'body' in e &&
    typeof e.body === 'object' &&
    e.body !== null &&
    'code' in (e.body as Record<string, unknown>)
  ) {
    return true;
  }

  // statusCode가 있으면 BetterAuthError로 간주해볼 수 않음 (일반 에러일 수도 있으나 처리를 시도)
  if ('statusCode' in e && typeof e.statusCode === 'number') {
    return true;
  }

  return false;
}

export function mapBetterAuthErrorToHttpException(
  error: BetterAuthError,
): HttpException | null {
  const code = error.body?.code || error.code;
  const message = error.body?.message || error.message;

  // 1. 특정 에러 코드 매핑
  if (code) {
    switch (code) {
      case 'USER_ALREADY_EXISTS':
      case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
        return new ConflictException('이미 사용 중인 이메일입니다.');
      case 'INVALID_EMAIL_OR_PASSWORD':
        return new UnauthorizedException(
          '이메일 또는 비밀번호가 올바르지 않습니다.',
        );
      // 필요한 경우 추가
    }
  }

  // 2. 에러 코드로 매치되지 않았다면 statusCode 기반 매핑 (Fallback)
  if (error.statusCode) {
    switch (error.statusCode) {
      case 409:
        return new ConflictException(message || '충돌이 발생했습니다.');
      case 422:
        return new UnprocessableEntityException(
          message || '요청을 처리할 수 없습니다.',
        );
      case 401:
        return new UnauthorizedException(message || '인증이 필요합니다.');
      case 403:
        // ForbiddenException import 필요할 수 있음
        // 지금은 HttpException으로 대체하거나 추가 import
        return new ForbiddenException(message || '접근 권한이 없습니다.');
    }
  }

  return null;
}
