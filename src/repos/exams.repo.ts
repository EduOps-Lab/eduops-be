import { PrismaClient, Prisma } from '../generated/prisma/client.js';
import type { Exam, Question } from '../generated/prisma/client.js';
import type {
  CreateExamDto,
  UpdateExamDto,
  QuestionUpsertDto,
} from '../validations/exams.validation.js';

export type ExamWithQuestions = Exam & { questions: Question[] };

export class ExamsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** Exam 생성 (questions 포함) */
  async createWithQuestions(
    lectureId: string,
    instructorId: string,
    data: CreateExamDto,
    tx?: Prisma.TransactionClient,
  ): Promise<ExamWithQuestions> {
    const client = tx ?? this.prisma;

    // Prisma의 create는 nested create를 지원하므로 한 번에 생성 가능
    return await client.exam.create({
      data: {
        lectureId,
        instructorId,
        title: data.title,
        cutoffScore: data.cutoffScore,
        source: data.source,
        questions: {
          create: data.questions.map((q) => ({
            questionNumber: q.questionNumber,
            content: q.content,
            type: q.type,
            score: q.score,
            choices: q.choices ?? Prisma.JsonNull,
            correctAnswer: q.correctAnswer,
            source: q.source,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { questionNumber: 'asc' },
        },
      },
    });
  }

  /** Exam 조회 (ID) */
  async findById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Exam | null> {
    const client = tx ?? this.prisma;
    return await client.exam.findUnique({
      where: { id },
    });
  }

  /** Exam 조회 (ID) - Questions 포함 */
  async findByIdWithQuestions(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<ExamWithQuestions | null> {
    const client = tx ?? this.prisma;
    return await client.exam.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { questionNumber: 'asc' },
        },
      },
    });
  }

  /** Exam 기본 정보 수정 */
  async update(
    id: string,
    data: UpdateExamDto,
    tx?: Prisma.TransactionClient,
  ): Promise<Exam> {
    const client = tx ?? this.prisma;
    // questions 필드는 exclude하고 업데이트 (Prisma 타입 이슈 방지)
    const { questions: _questions, ...updateData } = data;

    return await client.exam.update({
      where: { id },
      data: updateData,
    });
  }

  // --- Question CRUD methods ---

  /** 문항 생성 */
  async createQuestion(
    examId: string,
    lectureId: string,
    data: QuestionUpsertDto,
    tx?: Prisma.TransactionClient,
  ): Promise<Question> {
    const client = tx ?? this.prisma;
    return await client.question.create({
      data: {
        examId,
        lectureId,
        questionNumber: data.questionNumber,
        content: data.content,
        type: data.type,
        score: data.score,
        choices: data.choices ?? Prisma.JsonNull,
        correctAnswer: data.correctAnswer,
        source: data.source,
      },
    });
  }

  /** 문항 수정 */
  async updateQuestion(
    id: string,
    data: QuestionUpsertDto,
    tx?: Prisma.TransactionClient,
  ): Promise<Question> {
    const client = tx ?? this.prisma;
    return await client.question.update({
      where: { id },
      data: {
        questionNumber: data.questionNumber,
        content: data.content,
        type: data.type,
        score: data.score,
        choices: data.choices ?? Prisma.JsonNull,
        correctAnswer: data.correctAnswer,
        source: data.source,
      },
    });
  }

  /** 문항 삭제 (여러 개) */
  async deleteQuestions(
    ids: string[],
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    // prisma deleteMany
    await client.question.deleteMany({
      where: { id: { in: ids } },
    });
  }

  /** 특정 시험의 모든 문항 조회 */
  async findQuestionsByExamId(
    examId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Question[]> {
    const client = tx ?? this.prisma;
    return await client.question.findMany({
      where: { examId },
      orderBy: { questionNumber: 'asc' },
    });
  }
}
