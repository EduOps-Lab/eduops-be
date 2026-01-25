import { z } from 'zod';

/**
 * Enrollment ID 파라미터 스키마
 * @example
 * {
 *   "enrollmentId": "cm5abc123"
 * }
 */
export const enrollmentIdParamSchema = z.object({
  enrollmentId: z
    .string()
    .trim()
    .min(1, { message: 'Enrollment ID는 필수입니다.' }),
});

export type EnrollmentIdParamDto = z.infer<typeof enrollmentIdParamSchema>;

// 전화번호 인증 요청
export const requestPhoneVerificationSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .min(10, '전화번호는 최소 10자리입니다.')
    .max(11, '전화번호는 최대 11자리입니다.')
    .regex(/^010\d{8}$/, '올바른 전화번호 형식이 아닙니다. (010XXXXXXXX)'),
  userType: z.enum(['STUDENT', 'PARENT'], {
    message: 'STUDENT 또는 PARENT만 가능합니다.',
  }),
});

export type RequestPhoneVerificationDto = z.infer<
  typeof requestPhoneVerificationSchema
>;

// 인증 코드 확인
export const confirmPhoneVerificationSchema = z.object({
  phoneNumber: z.string().trim().min(10).max(11),
  code: z
    .string()
    .trim()
    .min(6, '인증 코드는 6자리입니다.')
    .max(6, '인증 코드는 6자리입니다.'),
  userType: z.enum(['STUDENT', 'PARENT']),
});

export type ConfirmPhoneVerificationDto = z.infer<
  typeof confirmPhoneVerificationSchema
>;

// 전화번호로 수강 목록 조회 (임시 토큰 필요)
export const getEnrollmentsByPhoneQuerySchema = z.object({
  tempToken: z
    .string()
    .trim()
    .min(1, '임시 인증 토큰이 필요합니다.')
    .optional(), // optionalAuth이므로 선택적
});

export type GetEnrollmentsByPhoneQueryDto = z.infer<
  typeof getEnrollmentsByPhoneQuerySchema
>;

// 전화번호로 상세 조회
export const getEnrollmentDetailByPhoneQuerySchema = z.object({
  tempToken: z
    .string()
    .trim()
    .min(1, '임시 인증 토큰이 필요합니다.')
    .optional(),
});

export type GetEnrollmentDetailByPhoneQueryDto = z.infer<
  typeof getEnrollmentDetailByPhoneQuerySchema
>;
