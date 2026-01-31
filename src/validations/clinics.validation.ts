import { z } from 'zod';

/** 클리닉 일괄 생성 요청 스키마 */
export const createClinicsSchema = z.object({
  title: z.string().optional(),
  deadline: z.string().datetime().optional(), // ISO 8601 string
  memo: z.string().optional(),
});

export type CreateClinicsDto = z.infer<typeof createClinicsSchema>;

/** 클리닉 조회 쿼리 스키마 */
export const getClinicsQuerySchema = z.object({
  lectureId: z.string().optional(),
  examId: z.string().optional(),
});

export type GetClinicsQueryDto = z.infer<typeof getClinicsQuerySchema>;

/** 클리닉 다중 수정 요청 스키마 */
export const updateClinicsSchema = z.object({
  clinicIds: z
    .array(z.string())
    .min(1, '최소 1개 이상의 클리닉 ID가 필요합니다.'),
  updates: z
    .object({
      status: z.enum(['PENDING', 'SENT', 'COMPLETED']).optional(),
      deadline: z.string().datetime().nullable().optional(),
      memo: z.string().nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: '최소 1개 이상의 수정 필드가 필요합니다.',
    }),
});

export type UpdateClinicsDto = z.infer<typeof updateClinicsSchema>;
