import { z } from 'zod';

/**
 * 수강 목록 조회 쿼리 파라미터 스키마
 * @example
 * {
 *   "appStudentId": "abc1234"
 * }
 * 또는
 * {
 *   "appParentLinkId": "def5678"
 * }
 */
export const getEnrollmentsQuerySchema = z
  .object({
    appStudentId: z.string().trim().min(1).optional(),
    appParentLinkId: z.string().trim().min(1).optional(),
    // @todo: 전화 기반으로 조회 할수있게 추가
    studentPhone: z.string().trim().min(1).optional(),
    parentPhone: z.string().trim().min(1).optional(),
  })
  .refine(
    (data) =>
      data.appStudentId ||
      data.appParentLinkId ||
      data.studentPhone ||
      data.parentPhone,
    {
      message:
        'appStudentId, appParentLinkId, studentPhone, parentPhone 중 하나는 필수입니다.',
    },
  );

export type GetEnrollmentsQueryDto = z.infer<typeof getEnrollmentsQuerySchema>;

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
 * Enrollment 상세 조회 쿼리 파라미터 스키마 (권한 확인용)
 * @example
 * {
 *   "appStudentId": "abc1234"
 * }
 * 또는
 * {
 *   "appParentLinkId": "def5678"
 * }
 */
export const getEnrollmentDetailQuerySchema = z
  .object({
    appStudentId: z.string().min(1).trim().optional(),
    appParentLinkId: z.string().min(1).trim().optional(),
    // @todo: 전화 번호 기반으로 조회 할수있게 추가
    studentPhone: z.string().min(1).trim().optional(),
    parentPhone: z.string().min(1).trim().optional(),
  })
  .refine(
    (data) =>
      data.appStudentId ||
      data.appParentLinkId ||
      data.studentPhone ||
      data.parentPhone,
    {
      message:
        'appStudentId, appParentLinkId, studentPhone, parentPhone 중 하나는 필수입니다.',
    },
  );

export type GetEnrollmentDetailQueryDto = z.infer<
  typeof getEnrollmentDetailQuerySchema
>;
