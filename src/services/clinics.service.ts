import { PrismaClient } from '../generated/prisma/client.js';
import { UserType } from '../constants/auth.constant.js';
import { GradingStatus } from '../constants/exams.constant.js';
import {
  NotFoundException,
  BadRequestException,
} from '../err/http.exception.js';
import { ClinicsRepository } from '../repos/clinics.repo.js';
import { ExamsRepository } from '../repos/exams.repo.js';
import { LecturesRepository } from '../repos/lectures.repo.js';
import { PermissionService } from './permission.service.js';
import type { CreateClinicsDto } from '../validations/clinics.validation.js';

export class ClinicsService {
  constructor(
    private readonly clinicsRepo: ClinicsRepository,
    private readonly examsRepo: ExamsRepository,
    private readonly lecturesRepo: LecturesRepository,
    private readonly permissionService: PermissionService,
    private readonly prisma: PrismaClient,
  ) {}

  /** 채점 완료 및 클리닉 일괄 생성 */
  async completeGrading(
    examId: string,
    data: CreateClinicsDto,
    userType: UserType,
    profileId: string,
  ) {
    const { title: inputTitle, deadline, memo } = data;

    // 1. Exam 확인
    const exam = await this.examsRepo.findById(examId);
    if (!exam) {
      throw new NotFoundException('시험을 찾을 수 없습니다.');
    }

    // Default Title Setting
    const title = inputTitle || `${exam.title} 클리닉`;

    // 2. 권한 검증 (강사/조교)
    const lecture = await this.lecturesRepo.findById(exam.lectureId);
    if (!lecture) {
      throw new NotFoundException('강의를 찾을 수 없습니다.');
    }
    await this.permissionService.validateInstructorAccess(
      lecture.instructorId,
      userType,
      profileId,
    );

    // 2-1. 채점 상태 검증 (채점 중일 경우에만 완료 처리 가능)
    if (exam.gradingStatus !== GradingStatus.IN_PROGRESS) {
      throw new BadRequestException(
        '채점이 진행 중인 시험에 대해서만 채점 완료(클리닉 생성)를 수행할 수 있습니다.',
      );
    }

    // 3. 불합격자 조회
    const failedGrades =
      await this.clinicsRepo.findFailedGradesByExamId(examId);

    // 4. 중복 생성 방지
    // 이미 클리닉이 생성된 enrollmentId 조회
    const enrollmentIds = failedGrades.map((g) => g.enrollmentId);
    let targets = failedGrades;

    if (failedGrades.length > 0) {
      const existingClinics = await this.clinicsRepo.findExistingClinics(
        examId,
        enrollmentIds,
      );
      const existingEnrollmentIds = new Set(
        existingClinics.map((c) => c.enrollmentId),
      );

      // 5. 생성할 데이터 준비
      // 중복되지 않은 학생들만 필터링
      targets = failedGrades.filter(
        (g) => !existingEnrollmentIds.has(g.enrollmentId),
      );
    }

    // 6. 일괄 생성 (Transaction)
    const deadlineDate = deadline ? new Date(deadline) : undefined;
    const assignedInstructorId = lecture.instructorId;

    const result = await this.prisma.$transaction(async (tx) => {
      let createCount = 0;
      if (targets.length > 0) {
        const createResult = await this.clinicsRepo.createMany(
          targets.map((t) => ({
            lectureId: exam.lectureId,
            examId: examId,
            enrollmentId: t.enrollmentId,
            title: title,
            deadline: deadlineDate,
            memo: memo,
            instructorId: assignedInstructorId,
          })),
          tx,
        );
        createCount = createResult.count;
      }

      // 상태 변경 (채점 중 -> 완료)
      await this.examsRepo.updateGradingStatus(
        examId,
        GradingStatus.COMPLETED,
        tx,
      );

      return { count: createCount };
    });

    return {
      count: result.count,
      message: `채점이 완료되었습니다. (클리닉 생성: ${result.count}건, 총 불합격자: ${failedGrades.length}명)`,
    };
  }
}
