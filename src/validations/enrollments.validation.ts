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

/**
 * 수강 등록 스키마
 */
export const createEnrollmentSchema = z.object({
  school: z.string().trim().min(1, '학교명은 필수입니다.'),
  schoolYear: z.string().trim().min(1, '학년은 필수입니다.'),
  studentName: z.string().trim().min(1, '학생 이름은 필수입니다.'),
  studentPhone: z
    .string()
    .trim()
    .regex(/^01[0-9]-?[0-9]{4}-?[0-9]{4}$/, '유효한 전화번호 형식이 아닙니다.'),
  parentPhone: z
    .string()
    .trim()
    .regex(/^01[0-9]-?[0-9]{4}-?[0-9]{4}$/, '유효한 전화번호 형식이 아닙니다.'),
  memo: z.string().optional(),
});

export type CreateEnrollmentDto = z.infer<typeof createEnrollmentSchema>;

/**
 * 수강 정보 수정 스키마
 */
export const updateEnrollmentSchema = z.object({
  school: z.string().trim().min(1, '학교명은 필수입니다.').optional(),
  schoolYear: z.string().trim().min(1, '학년은 필수입니다.').optional(),
  studentName: z.string().trim().min(1, '학생 이름은 필수입니다.').optional(),
  studentPhone: z
    .string()
    .trim()
    .regex(/^01[0-9]-?[0-9]{4}-?[0-9]{4}$/, '유효한 전화번호 형식이 아닙니다.')
    .optional(),
  parentPhone: z
    .string()
    .trim()
    .regex(/^01[0-9]-?[0-9]{4}-?[0-9]{4}$/, '유효한 전화번호 형식이 아닙니다.')
    .optional(),
  memo: z.string().optional(),
  status: z.enum(['ACTIVE', 'DROPPED', 'PAUSED']).optional(),
});

export type UpdateEnrollmentDto = z.infer<typeof updateEnrollmentSchema>;

/**
 * 수강생 목록 조회 쿼리 스키마
 */
export const enrollmentsQuerySchema = z.object({
  lectureId: z.string().optional(), // 특정 강의만 조회할 경우
  status: z.enum(['ACTIVE', 'DROPPED', 'PAUSED']).optional(), // 상태 필터링
});

export type EnrollmentsQueryDto = z.infer<typeof enrollmentsQuerySchema>;
