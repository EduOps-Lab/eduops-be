import { z } from 'zod';

/** 클리닉 일괄 생성 요청 스키마 */
export const createClinicsSchema = z.object({
  title: z.string().min(1, '클리닉 제목은 필수입니다.'),
  deadline: z.string().datetime().optional(), // ISO 8601 string
  memo: z.string().optional(),
});

export type CreateClinicsDto = z.infer<typeof createClinicsSchema>;
