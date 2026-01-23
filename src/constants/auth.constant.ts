import { isProduction } from '../config/env.config.js';

export const UserType = {
  INSTRUCTOR: 'INSTRUCTOR',
  ASSISTANT: 'ASSISTANT',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
} as const;

export type UserType = (typeof UserType)[keyof typeof UserType];

// 각 userType에 해당하는 Prisma 모델 매핑
export const UserTypeToModel = {
  INSTRUCTOR: 'instructor',
  ASSISTANT: 'assistant',
  STUDENT: 'appStudent',
  PARENT: 'appParent',
} as const;

// 쿠키 설정
export const AUTH_COOKIE_PREFIX = 'eduops_auth';
export const AUTH_COOKIE_NAME = `${AUTH_COOKIE_PREFIX}.session_token`;
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction(),
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
};
