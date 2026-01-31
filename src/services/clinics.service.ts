import { PrismaClient } from '../generated/prisma/client.js';
import { UserType } from '../constants/auth.constant.js';
import { NotFoundException } from '../err/http.exception.js';
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

  /** 불합격자 대상 클리닉 일괄 생성 */
  async createClinicsForFailedStudents(
    examId: string,
    data: CreateClinicsDto,
    userType: UserType,
    profileId: string,
  ) {
    const { title, deadline, memo } = data;

    // 1. Exam 확인
    const exam = await this.examsRepo.findById(examId);
    if (!exam) {
      throw new NotFoundException('시험을 찾을 수 없습니다.');
    }

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

    // 3. 불합격자 조회
    const failedGrades =
      await this.clinicsRepo.findFailedGradesByExamId(examId);

    if (failedGrades.length === 0) {
      return {
        count: 0,
        message: '불합격자가 없어 클리닉을 생성하지 않았습니다.',
      };
    }

    // 4. 중복 생성 방지
    // 이미 클리닉이 생성된 enrollmentId 조회
    const enrollmentIds = failedGrades.map((g) => g.enrollmentId);
    const existingClinics = await this.clinicsRepo.findExistingClinics(
      examId,
      enrollmentIds,
    );
    const existingEnrollmentIds = new Set(
      existingClinics.map((c) => c.enrollmentId),
    );

    // 5. 생성할 데이터 준비
    // 중복되지 않은 학생들만 필터링
    const targets = failedGrades.filter(
      (g) => !existingEnrollmentIds.has(g.enrollmentId),
    );

    if (targets.length === 0) {
      return {
        count: 0,
        message: '모든 불합격자에 대해 이미 클리닉이 생성되어 있습니다.',
      };
    }

    // deadline 문자열을 Date 객체로 변환 (Validation에서 datetime 형식 검증됨)
    const deadlineDate = deadline ? new Date(deadline) : undefined;

    // 생성자 ID (강사/조교)
    // 조교가 생성하더라도 InstructorId 필드는 해당 강의의 강사 ID를 따라가거나,
    // 혹은 생성자 정보를 별도로 남기는데, Clinic 스키마에는 instructorId가 있음.
    // 여기서는 일단 Optional인 instructorId에 현재 컨텍스트의 강사 ID를 넣을 수 있지만,
    // 조교인 경우 profileId는 AssistantId이므로 주의 필요.
    // Clinic.instructorId는 "담당 강사" 의미가 강하므로 lecture.instructorId를 넣는 것이 좋을 수도 있음.
    // 또는, 생성 주체를 기록하고 싶다면 별도 필드가 필요하지만 모델엔 없음.
    // 여기서는 lecture.instructorId를 넣어서 '담당 강사'를 명시하거나 생략.
    // 요구사항: 불합격자에 대한 내용 테이블에 저장 -> 강사 ID는 보통 강의 담당자.
    const assignedInstructorId = lecture.instructorId;

    // 6. 일괄 생성 (Transaction)
    // createMany 결과는 { count: number }
    const result = await this.prisma.$transaction(async (tx) => {
      return await this.clinicsRepo.createMany(
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
    });

    return {
      count: result.count,
      message: `${result.count}건의 클리닉이 생성되었습니다. (총 불합격자: ${failedGrades.length}명, 기생성: ${existingClinics.length}명)`,
    };
  }
}
