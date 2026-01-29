import { z } from 'zod';
import { AttendanceStatus } from '../constants/attendances.constant.js';

// --- Params ---

export const attendanceIdParamSchema = z.object({
  enrollmentId: z.string().trim().min(1, 'Enrollment ID는 필수입니다.'),
  attendanceId: z.string().trim().min(1, 'Attendance ID는 필수입니다.'),
});

export type AttendanceIdParamDto = z.infer<typeof attendanceIdParamSchema>;

// --- Body ---

/** 단일 출결 생성 스키마 */
export const createAttendanceSchema = z.object({
  date: z.coerce.date(),
  status: z.nativeEnum(AttendanceStatus).default(AttendanceStatus.PRESENT),
  enterTime: z.coerce.date().optional(),
  leaveTime: z.coerce.date().optional(),
  memo: z.string().optional(),
});

export type CreateAttendanceDto = z.infer<typeof createAttendanceSchema>;

const bulkAttendanceItemSchema = z.object({
  enrollmentId: z.string().trim().min(1, 'Enrollment ID는 필수입니다.'),
  date: z.coerce.date(),
  status: z.nativeEnum(AttendanceStatus).default(AttendanceStatus.PRESENT),
  enterTime: z.coerce.date().optional(),
  leaveTime: z.coerce.date().optional(),
  memo: z.string().optional(),
});

export const createBulkAttendancesSchema = z.object({
  attendances: z
    .array(bulkAttendanceItemSchema)
    .min(1, '최소 1개 이상의 출결 정보가 필요합니다.'),
});

// Service에서 사용하기 편하도록 Item 타입도 export
export type BulkAttendanceDto = z.infer<typeof bulkAttendanceItemSchema>;
export type CreateBulkAttendancesDto = z.infer<
  typeof createBulkAttendancesSchema
>;

/** 출결 수정 스키마 */
export const updateAttendanceSchema = z.object({
  status: z.nativeEnum(AttendanceStatus).optional(),
  enterTime: z.coerce.date().optional(),
  leaveTime: z.coerce.date().optional(),
  memo: z.string().optional(),
});

export type UpdateAttendanceDto = z.infer<typeof updateAttendanceSchema>;
