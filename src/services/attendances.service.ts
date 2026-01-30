import { PrismaClient } from '../generated/prisma/client.js';
import type { Attendance, Enrollment } from '../generated/prisma/client.js';
import { UserType } from '../constants/auth.constant.js';
import { NotFoundException } from '../err/http.exception.js';
import { AttendancesRepository } from '../repos/attendances.repo.js';
import { EnrollmentsRepository } from '../repos/enrollments.repo.js';
import { LecturesRepository } from '../repos/lectures.repo.js';
import { AssistantRepository } from '../repos/assistant.repo.js';
import { ParentsService } from './parents.service.js';
import { PermissionService } from './permission.service.js';
import type {
  CreateAttendanceDto,
  BulkAttendanceDto,
  UpdateAttendanceDto,
} from '../validations/attendances.validation.js';
import {
  calculateAttendanceStats,
  AttendanceStats,
} from '../utils/attendance.util.js';

export class AttendancesService {
  constructor(
    private readonly attendancesRepository: AttendancesRepository,
    private readonly enrollmentsRepository: EnrollmentsRepository,
    private readonly lecturesRepository: LecturesRepository,
    private readonly assistantRepository: AssistantRepository,
    private readonly parentsService: ParentsService,
    private readonly permissionService: PermissionService,
    private readonly prisma: PrismaClient,
  ) {}

  /** 강의 내 단체 출결 등록 (Transaction + Upsert Loop) */
  async createBulkAttendances(
    lectureId: string,
    attendances: BulkAttendanceDto[],
    userType: UserType,
    profileId: string,
  ) {
    // 1. 강의 확인
    const lecture = await this.lecturesRepository.findById(lectureId);
    if (!lecture) {
      throw new NotFoundException('강의를 찾을 수 없습니다.');
    }

    // 2. 권한 확인 (강사/조교)
    await this.permissionService.validateInstructorAccess(
      lecture.instructorId,
      userType,
      profileId,
    );

    // 3. Transactional Upsert
    return await this.prisma.$transaction(async (tx) => {
      const results = [];
      for (const item of attendances) {
        // Enrollment 유효성 체크
        const enrollment =
          await this.enrollmentsRepository.findByIdWithRelations(
            item.enrollmentId,
            tx,
          );
        if (!enrollment || enrollment.lectureId !== lectureId) {
          throw new NotFoundException(
            `수강 정보(ID: ${item.enrollmentId})를 찾을 수 없거나 해당 강의의 수강생이 아닙니다.`,
          );
        }

        // 날짜 정규화 (시간 제거)
        const dateOnly = this.truncateTime(new Date(item.date));

        // Upsert
        const result = await this.attendancesRepository.upsert(
          {
            enrollmentId_date: {
              enrollmentId: item.enrollmentId,
              date: dateOnly,
            },
          },
          {
            enrollmentId: item.enrollmentId,
            date: dateOnly,
            status: item.status,
            enterTime: item.enterTime ? new Date(item.enterTime) : null,
            leaveTime: item.leaveTime ? new Date(item.leaveTime) : null,
            memo: item.memo,
          },
          {
            status: item.status,
            enterTime: item.enterTime ? new Date(item.enterTime) : undefined,
            leaveTime: item.leaveTime ? new Date(item.leaveTime) : undefined,
            memo: item.memo,
          },
          tx,
        );
        results.push(result);
      }
      return results;
    });
  }

  /** 단일 수강생 출결 등록 (Upsert) */
  async createAttendance(
    enrollmentId: string,
    data: CreateAttendanceDto,
    userType: UserType,
    profileId: string,
  ) {
    const enrollment =
      await this.enrollmentsRepository.findByIdWithRelations(enrollmentId);
    if (!enrollment) {
      throw new NotFoundException('수강 정보를 찾을 수 없습니다.');
    }

    // 권한 확인
    await this.permissionService.validateInstructorAccess(
      enrollment.instructorId,
      userType,
      profileId,
    );

    const dateOnly = this.truncateTime(new Date(data.date));

    return await this.attendancesRepository.upsert(
      {
        enrollmentId_date: {
          enrollmentId,
          date: dateOnly,
        },
      },
      {
        enrollmentId,
        date: dateOnly,
        status: data.status,
        enterTime: data.enterTime ? new Date(data.enterTime) : null,
        leaveTime: data.leaveTime ? new Date(data.leaveTime) : null,
        memo: data.memo,
      },
      {
        status: data.status,
        enterTime: data.enterTime ? new Date(data.enterTime) : undefined,
        leaveTime: data.leaveTime ? new Date(data.leaveTime) : undefined,
        memo: data.memo,
      },
    );
  }

  /** 수강생 출결 조회 + 통계 */
  async getAttendancesByEnrollment(
    enrollmentId: string,
    userType: UserType,
    profileId: string,
  ): Promise<{ attendances: Attendance[]; stats: AttendanceStats }> {
    const enrollment =
      await this.enrollmentsRepository.findByIdWithRelations(enrollmentId);
    if (!enrollment) {
      throw new NotFoundException('수강 정보를 찾을 수 없습니다.');
    }

    // 권한 확인 (강사/조교 or 학생 본인 or 학부모)
    await this.validateReadAccess(enrollment, userType, profileId);

    const attendances =
      await this.attendancesRepository.findByEnrollmentId(enrollmentId);
    const stats = calculateAttendanceStats(attendances);

    return { attendances, stats };
  }

  /** 출결 수정 */
  async updateAttendance(
    enrollmentId: string, // URL Path param 검증용
    attendanceId: string,
    data: UpdateAttendanceDto,
    userType: UserType,
    profileId: string,
  ) {
    const attendance = await this.attendancesRepository.findById(attendanceId);
    if (!attendance) {
      throw new NotFoundException('출결 정보를 찾을 수 없습니다.');
    }

    if (attendance.enrollmentId !== enrollmentId) {
      throw new NotFoundException(
        '해당 수강생의 출결 정보가 아닙니다. (URL 불일치)',
      );
    }

    const enrollment = await this.enrollmentsRepository.findByIdWithRelations(
      attendance.enrollmentId,
    );
    if (!enrollment) {
      throw new NotFoundException('관련 수강 정보를 찾을 수 없습니다.');
    }

    // 권한 확인 (수정은 강사/조교만)
    await this.permissionService.validateInstructorAccess(
      enrollment.instructorId,
      userType,
      profileId,
    );

    return await this.attendancesRepository.update(attendanceId, {
      ...data,
      enterTime: data.enterTime ? new Date(data.enterTime) : undefined,
      leaveTime: data.leaveTime ? new Date(data.leaveTime) : undefined,
    });
  }

  /** Helper Functions */

  /** 날짜에서 시간 제거 (00:00:00.000) */
  private truncateTime(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /** 조회 권한 체크 (강사/조교/학생/학부모) */
  private async validateReadAccess(
    enrollment: Enrollment,
    userType: UserType,
    profileId: string,
  ) {
    await this.permissionService.validateEnrollmentReadAccess(
      enrollment,
      userType,
      profileId,
    );
  }
}
