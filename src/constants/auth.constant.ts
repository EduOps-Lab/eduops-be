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

// 인증 쿠키 이름
export const AUTH_COOKIE_NAME = 'ssambee-auth.session_token';
