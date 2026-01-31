import { PrismaClient } from '../generated/prisma/client.js';
import { UserType } from '../constants/auth.constant.js';
import { GradingStatus } from '../constants/exams.constant.js';
import {
  NotFoundException,
  BadRequestException,
} from '../err/http.exception.js';
import { GradesRepository } from '../repos/grades.repo.js';
import { ExamsRepository } from '../repos/exams.repo.js';
import { LecturesRepository } from '../repos/lectures.repo.js';
import { PermissionService } from './permission.service.js';
import type { SubmitGradingDto } from '../validations/grades.validation.js';

export class GradesService {
  constructor(
    private readonly gradesRepo: GradesRepository,
    private readonly examsRepo: ExamsRepository,
    private readonly lecturesRepo: LecturesRepository,
    private readonly permissionService: PermissionService,
    private readonly prisma: PrismaClient,
  ) {}

  /** 학생 답안 채점 및 제출 */
  async submitGrading(
    examId: string,
    data: SubmitGradingDto,
    userType: UserType,
    profileId: string,
  ) {
    const { enrollmentId, answers, totalScore, correctCount } = data;

    // 1. Exam 확인 (LectureId 확보)
    const exam = await this.examsRepo.findById(examId);
    if (!exam) {
      throw new NotFoundException('시험을 찾을 수 없습니다.');
    }

    if (exam.gradingStatus === GradingStatus.COMPLETED) {
      throw new BadRequestException('이미 채점이 완료된 시험입니다.');
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

    // 3. 보안 채점 로직
    const questions = await this.examsRepo.findQuestionsByExamId(examId);
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    let calculatedTotalScore = 0;
    let calculatedCorrectCount = 0;
    const seenQuestionIds = new Set<string>();

    for (const answer of answers) {
      if (seenQuestionIds.has(answer.questionId)) {
        throw new BadRequestException(
          `중복된 문항 ID가 제출되었습니다: ${answer.questionId}`,
        );
      }
      seenQuestionIds.add(answer.questionId);

      const question = questionMap.get(answer.questionId);
      if (!question) {
        throw new BadRequestException(
          `문항 ID ${answer.questionId}가 유효하지 않습니다.`,
        );
      }

      // 정답 비교 로직
      let isActuallyCorrect = false;

      // [Rule] 서술형(ESSAY)은 서버에서 자동 채점하지 않고 채점관(Client)의 판정을 신뢰
      if (question.type === 'ESSAY') {
        isActuallyCorrect = answer.isCorrect;
      } else {
        // 객관식은 서버 정답과 비교
        isActuallyCorrect = question.correctAnswer === answer.submittedAnswer;

        // 클라이언트 검증 (객관식만 수행)
        if (answer.isCorrect !== isActuallyCorrect) {
          throw new BadRequestException(
            `문항 ${question.questionNumber}번의 채점 결과가 올바르지 않습니다.`,
          );
        }
      }

      if (isActuallyCorrect) {
        calculatedTotalScore += question.score;
        calculatedCorrectCount++;
      }
    }

    // 총점 및 개수 검증
    if (calculatedTotalScore !== totalScore) {
      throw new BadRequestException(
        `총점이 올바르지 않습니다. (Server: ${calculatedTotalScore}, Client: ${totalScore})`,
      );
    }
    if (calculatedCorrectCount !== correctCount) {
      throw new BadRequestException(
        `정답 개수가 올바르지 않습니다. (Server: ${calculatedCorrectCount}, Client: ${correctCount})`,
      );
    }

    // 4. Pass 여부 판단
    const isPass = calculatedTotalScore >= exam.cutoffScore;

    // 5. DB Upsert (Transaction)
    // 5. DB Upsert (Transaction)
    return await this.prisma.$transaction(async (tx) => {
      // 5-0. 시험 상태 변경 (채점 전 -> 채점 중)
      if (exam.gradingStatus === GradingStatus.PENDING) {
        await this.examsRepo.updateGradingStatus(
          examId,
          GradingStatus.IN_PROGRESS,
          tx,
        );
      }

      // 5-1. 답안 Upsert
      await this.gradesRepo.upsertStudentAnswers(
        exam.lectureId,
        enrollmentId,
        answers,
        tx,
      );

      // 5-2. 성적 Upsert
      return await this.gradesRepo.upsertGrade(
        exam.lectureId,
        examId,
        enrollmentId,
        calculatedTotalScore,
        isPass,
        tx,
      );
    });
  }

  /** 시험 성적 목록 조회 */
  async getGradesByExam(examId: string, userType: UserType, profileId: string) {
    // 1. Exam 확인
    const exam = await this.examsRepo.findById(examId);
    if (!exam) {
      throw new NotFoundException('시험을 찾을 수 없습니다.');
    }

    // 2. 권한 검증
    const lecture = await this.lecturesRepo.findById(exam.lectureId);
    if (!lecture) {
      throw new NotFoundException('강의를 찾을 수 없습니다.');
    }
    await this.permissionService.validateInstructorAccess(
      lecture.instructorId,
      userType,
      profileId,
    );

    // 3. 성적 조회
    return await this.gradesRepo.findGradesByExamId(examId);
  }
}
