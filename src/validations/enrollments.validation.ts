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
