import { z } from 'zod';

/**
 * LectureTime 단일 항목 스키마
 * @example
 * {
 *   "day": "월",
 *   "startTime": "14:00",
 *   "endTime": "16:00"
 * }
 */
export const lectureTimeItemSchema = z.object({
  day: z.string().min(1, { message: '요일은 최소 1개 이상이어야 합니다.' }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: '시작 시간은 HH:MM 형식이어야 합니다.',
  }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: '종료 시간은 HH:MM 형식이어야 합니다.',
  }),
});

export type LectureTimeItemDto = z.infer<typeof lectureTimeItemSchema>;

/**
 * 강의 생성 요청 DTO 스키마 (frontend에서 요청하는 데이터 형식)
 *  변경 사항 발생 시 여기서 수정
 * @example
 * {
 *   "instructorId": "abc1234",
 *   "title": "강의 제목",
 *   "subject": "강의 과목",
 *   "description": "강의 설명",
 *   "endAt": "2026-01-22T10:00:00.000Z",
 *   "lectureTimes": [
 *     { "day": ["월"], "startTime": "14:00", "endTime": "16:00" }
 *   ]
 * }
 */
export const createLectureSchema = z.object({
  title: z
    .string()
    .min(1, { message: '강의 제목은 필수입니다.' })
    .max(255, { message: '강의 제목은 255자를 초과할 수 없습니다.' })
    .trim(),

  subject: z
    .string()
    .max(100, { message: '과목명은 100자를 초과할 수 없습니다.' })
    .trim()
    .optional(),

  description: z
    .string()
    .max(5000, { message: '설명은 5000자를 초과할 수 없습니다.' })
    .trim()
    .optional(),

  endAt: z
    .string()
    .datetime({ message: '유효한 ISO 8601 날짜 형식이어야 합니다.' })
    .optional()
    .nullable(),

  lectureTimes: z.array(lectureTimeItemSchema).optional(),
});

export type CreateLectureDto = z.infer<typeof createLectureSchema>;
export type CreateLectureWithInstructorIdDto = CreateLectureDto & {
  instructorId: string;
};

/**
 * 강의 리스트 조회 쿼리 파라미터 스키마
 * @example
 * {
 *   "instructorId": "abc1234",
 *   "page": 1,
 *   "limit": 20,
 *   "search": "수학"
 * }
 */
export const getLecturesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});

export type GetLecturesQueryDto = z.infer<typeof getLecturesQuerySchema>;

/**
 * 강의 ID 파라미터 스키마
 * @example
 * {
 *   "id": "cm5abc123"
 * }
 */
export const lectureIdParamSchema = z.object({
  id: z.string().min(1, { message: '강의 ID는 필수입니다.' }),
});

export type LectureIdParamDto = z.infer<typeof lectureIdParamSchema>;

/**
 * 강의 수정 요청 스키마
 * @example
 * {
 *   "instructorId": "abc1234",
 *   "title": "고등수학 심화반 (수정)",
 *   "subject": "수학",
 *   "description": "업데이트된 설명",
 *   "endAt": "2026-12-31T23:59:59.000Z",
 *   "isActive": false
 * }
 */
export const updateLectureSchema = z.object({
  title: z
    .string()
    .min(1, { message: '강의 제목은 필수입니다.' })
    .max(255, { message: '강의 제목은 255자를 초과할 수 없습니다.' })
    .trim()
    .optional(),

  subject: z
    .string()
    .max(100, { message: '과목명은 100자를 초과할 수 없습니다.' })
    .trim()
    .optional(),

  description: z
    .string()
    .max(5000, { message: '설명은 5000자를 초과할 수 없습니다.' })
    .trim()
    .optional(),

  endAt: z
    .string()
    .datetime({ message: '유효한 ISO 8601 날짜 형식이어야 합니다.' })
    .optional()
    .nullable(),

  isActive: z.boolean().optional(),
});

export type UpdateLectureDto = z.infer<typeof updateLectureSchema>;

/**
 * 강의 삭제 요청 스키마
 * @example
 * {
 *   "instructorId": "abc1234"
 * }
 */
export const deleteLectureSchema = z.object({});

export type DeleteLectureDto = z.infer<typeof deleteLectureSchema>;
