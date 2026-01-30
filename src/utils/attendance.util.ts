import { Attendance } from '../generated/prisma/client.js';
import { AttendanceStatus } from '../constants/attendances.constant.js';

export interface AttendanceStats {
  totalCount: number; // 전체 수업 일수
  presentCount: number; // 출석
  lateCount: number; // 지각
  absentCount: number; // 결석
  earlyLeaveCount: number; // 조퇴
  attendanceRate: number; // 출석율 (%)
  absentRate: number; // 결석율 (%)
}

/**
 * 출결 목록을 기반으로 통계를 계산합니다.
 */
export function calculateAttendanceStats(
  attendances: Attendance[],
): AttendanceStats {
  const totalCount = attendances.length;

  if (totalCount === 0) {
    return {
      totalCount: 0,
      presentCount: 0,
      lateCount: 0,
      absentCount: 0,
      earlyLeaveCount: 0,
      attendanceRate: 0,
      absentRate: 0,
    };
  }

  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let earlyLeaveCount = 0;

  for (const att of attendances) {
    switch (att.status) {
      case AttendanceStatus.PRESENT:
        presentCount++;
        break;
      case AttendanceStatus.LATE:
        lateCount++;
        break;
      case AttendanceStatus.ABSENT:
        absentCount++;
        break;
      case AttendanceStatus.EARLY_LEAVE:
        earlyLeaveCount++;
        break;
    }
  }

  // 출석율: (출석 + 지각 + 조퇴) / 전체 * 100
  // 일반적으로 지각/조퇴도 '출석' 범주에 포함하되 감점 요소로 보거나 학교/학원 내규에 따름.
  // 여기서는 단순히 (출석+지각+조퇴)를 출석 인정으로 간주하거나,
  // 요구사항에 따라 달라질 수 있으나, 통상적으로 결석을 제외한 것을 출석으로 봅니다.
  const attendanceRate =
    ((presentCount + lateCount + earlyLeaveCount) / totalCount) * 100;

  // 결석율: 결석 / 전체 * 100
  const absentRate = (absentCount / totalCount) * 100;

  return {
    totalCount,
    presentCount,
    lateCount,
    absentCount,
    earlyLeaveCount,
    attendanceRate: Number(attendanceRate.toFixed(1)), // 소수점 한자리 반올림
    absentRate: Number(absentRate.toFixed(1)),
  };
}
