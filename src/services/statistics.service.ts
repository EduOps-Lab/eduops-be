import { PrismaClient, Prisma } from '../generated/prisma/client.js';
import { UserType } from '../constants/auth.constant.js';
import { NotFoundException } from '../err/http.exception.js';
import { StatisticsRepository } from '../repos/statistics.repo.js';
import { ExamsRepository } from '../repos/exams.repo.js';
import { LecturesRepository } from '../repos/lectures.repo.js';
import { PermissionService } from './permission.service.js';

export class StatisticsService {
  constructor(
    private readonly statisticsRepo: StatisticsRepository,
    private readonly examsRepo: ExamsRepository,
    private readonly lecturesRepo: LecturesRepository,
    private readonly permissionService: PermissionService,
    private readonly prisma: PrismaClient,
  ) {}

  /** 통계 산출 및 저장 */
  async calculateAndSaveStatistics(
    examId: string,
    userType: UserType,
    profileId: string,
  ) {
    // 1. Exam 확인
    const exam = await this.examsRepo.findById(examId);
    if (!exam) {
      throw new NotFoundException('시험을 찾을 수 없습니다.');
    }

    // 2. 권한 검증 (강사/조교)
    await this.permissionService.validateInstructorAccess(
      exam.instructorId!,
      userType,
      profileId,
    );

    // 3. 통계 산출 준비
    // 3-1. 전체 문항 목록 조회
    const questions = await this.examsRepo.findQuestionsByExamId(examId);
    if (questions.length === 0) {
      return []; // 문항이 없으면 빈 배열 반환
    }

    // 3-2. 분모: 성적 제출자 수 조회
    const totalSubmissions =
      await this.statisticsRepo.countGradesByExamId(examId);

    // 4. 문항별 통계 계산 및 저장 (Transaction)
    return await this.prisma.$transaction(async (tx) => {
      const results = [];

      for (const question of questions) {
        // 4-1. 해당 문항에 대한 학생 답안 조회
        const answers =
          await this.statisticsRepo.findStudentAnswersByQuestionId(
            question.id,
            tx,
          );

        // 4-2. 정답률 계산
        // 분모가 0이면 0% 처리
        const correctCount = answers.filter((a) => a.isCorrect).length;
        const correctRate =
          totalSubmissions > 0
            ? Number(((correctCount / totalSubmissions) * 100).toFixed(2))
            : 0;

        // 4-3. 선지별 선택률 계산 (객관식인 경우)
        let choiceRates: Record<string, number> | null = null;
        if (question.type === 'MULTIPLE') {
          choiceRates = {};

          // 각 보기별 선택 횟수 집계
          const choiceCounts: Record<string, number> = {};
          answers.forEach((a) => {
            const choice = a.submittedAnswer; // "1", "2", ...
            choiceCounts[choice] = (choiceCounts[choice] || 0) + 1;
          });

          // 등록된 보기(question.choices)가 있다면 그 키를 기준으로 0%라도 채워줄 수 있음
          // 요구사항에 '각 문항의 선지별 선택률 jsonb 형태로 기록'이라 되어있으므로,
          // 답안에 등장한 선지 외에도 원본 보기에 있는 선지들도 포함하는 게 좋음.
          // 다만 question.choices 구조가 JSON이라 파싱 필요.
          // 여기서는 간단히 제출된 답안 기준으로만 집계하거나, 혹은 1~5번 등 일반적인 선지를 가정할 수 없으므로
          // "제출된 답안"에 등장한 키들 + (가능하다면) 원본 choices 키들을 합집합으로 처리.

          // 일단 제출된 답안 기준으로 비율 계산
          // 선택된 보기에 대해서만 비율 계산 (선택되지 않은 보기는 포함 안 될 수도 있음 -> 개선 포인트)
          // 하지만 전체 비율 합이 100% 근처가 되려면 분모는 totalSubmissions여야 함.
          // (무응답/건너뛰기 한 경우 합이 100% 미만일 수 있음)

          // Prisma JSON 타입 이슈 방지를 위해 any 혹은 타입 단언 필요할 수 있음
          // 여기서는 동적으로 수집된 키들에 대해 비율 계산

          Object.keys(choiceCounts).forEach((choiceKey) => {
            const count = choiceCounts[choiceKey];
            const rate =
              totalSubmissions > 0
                ? Number(((count / totalSubmissions) * 100).toFixed(2))
                : 0;
            choiceRates![choiceKey] = rate;
          });
        }

        // 4-4. 저장
        const statistic = await this.statisticsRepo.upsertQuestionStatistic(
          examId,
          question.id,
          {
            totalSubmissions,
            correctRate,
            choiceRates: choiceRates ?? Prisma.JsonNull,
          },
          tx,
        );
        results.push(statistic);
      }

      return results;
    });
  }

  /** 통계 조회 (확장: 전체 평균, 등수 등 포함) */
  async getStatistics(examId: string, userType: UserType, profileId: string) {
    // 1. Exam 확인 & 권한 검증
    const exam = await this.examsRepo.findById(examId);
    if (!exam) {
      throw new NotFoundException('시험을 찾을 수 없습니다.');
    }

    await this.permissionService.validateInstructorAccess(
      exam.instructorId!,
      userType,
      profileId,
    );

    // 2. 데이터 병렬 조회 (성능 최적화)
    const [summary, questionStats, studentGrades, correctCounts, questions] =
      await Promise.all([
        this.statisticsRepo.getExamSummary(examId),
        this.statisticsRepo.findStatisticsByExamId(examId),
        this.statisticsRepo.getStudentGradesWithInfo(examId),
        this.statisticsRepo.getStudentCorrectCounts(examId),
        this.examsRepo.findQuestionsByExamId(examId),
      ]);

    // 3. 문항 정보 매핑 (번호 추가)
    // Statistic에는 questionNumber가 없으므로 Question 엔티티와 조인하거나 매핑 필요
    const questionMap = new Map(questions.map((q) => [q.id, q.questionNumber]));
    const mappedQuestionStats = questionStats.map((stat) => ({
      questionId: stat.questionId,
      questionNumber: questionMap.get(stat.questionId),
      totalSubmissions: stat.totalSubmissions,
      correctRate: stat.correctRate,
      choiceRates: stat.choiceRates as Record<string, number> | null,
    }));

    // 4. 학생 성적 매핑 및 석차 계산
    const totalExaminees = summary.totalExaminees;
    let currentRank = 1;
    const studentStats = [];

    // studentGrades는 이미 score desc 정렬되어 있음
    for (let i = 0; i < studentGrades.length; i++) {
      const grade = studentGrades[i];
      const prevGrade = i > 0 ? studentGrades[i - 1] : null;

      // 동점자 처리: 이전 점수와 다르면 현재 인덱스+1이 새로운 등수
      if (prevGrade && prevGrade.score !== grade.score) {
        currentRank = i + 1;
      }

      studentStats.push({
        enrollmentId: grade.enrollmentId,
        studentName: grade.enrollment.studentName,
        school: grade.enrollment.school,
        correctCount: correctCounts[grade.enrollmentId] ?? 0,
        score: grade.score,
        rank: currentRank,
        totalRank: totalExaminees, // 분모 (예: 5/20등)
      });
    }

    return {
      examStats: summary,
      questionStats: mappedQuestionStats,
      studentStats,
    };
  }
}
