import {
  Lecture,
  Instructor,
  PrismaClient,
  Prisma,
} from '../generated/prisma/client.js';
import { QueryMode } from '../generated/prisma/internal/prismaNamespace.js';
import { CreateLectureDto } from '../validations/lectures.validation.js';

export class LecturesRepository {
  constructor(private readonly prisma: PrismaClient) {}
  /** 강의 생성 */
  async create(data: CreateLectureDto): Promise<Lecture> {
    return await this.prisma.lecture.create({
      data: {
        instructorId: data.instructorId,
        title: data.title,
        subject: data.subject,
        description: data.description,
        endAt: data.endAt ? new Date(data.endAt) : null,
      },
    });
  }

  /** ID로 강의 조회 */
  async findById(id: string): Promise<Lecture | null> {
    return await this.prisma.lecture.findUnique({
      where: { id, deletedAt: null },
    });
  }

  /** ID로 강사 조회 (존재 확인용) */
  async findInstructorById(instructorId: string): Promise<Instructor | null> {
    return await this.prisma.instructor.findUnique({
      where: { id: instructorId, deletedAt: null }, // Soft delete 확인
    });
  }

  /** 강의 리스트 조회 (커서 기반 페이지네이션) */
  async findMany(options: {
    page: number;
    limit: number;
    instructorId?: string;
    search?: string;
  }): Promise<{ lectures: Lecture[]; totalCount: number }> {
    const { page, limit, instructorId, search } = options;

    const where: Prisma.LectureWhereInput = {
      deletedAt: null,
      instructorId: instructorId ? { equals: instructorId } : undefined,
      OR: search
        ? [
            { title: { contains: search, mode: QueryMode.insensitive } },
            { subject: { contains: search, mode: QueryMode.insensitive } },
          ]
        : undefined,
    };

    const [lectures, totalCount] = await Promise.all([
      this.prisma.lecture.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lecture.count({ where }),
    ]);

    return { lectures, totalCount };
  }

  /** ID로 강의 조회  */
  async findByIdWithRelations(id: string): Promise<Lecture | null> {
    return await this.prisma.lecture.findUnique({
      where: { id, deletedAt: null },
      // TODO: 추후 instructor, assistants 관계 데이터 포함 가능 (담당 조교)
      // include: {
      //   instructor: {
      //     select: { id: true, name: true }
      //   }
      // }
    });
  }

  /** 강의 수정 */
  async update(
    id: string,
    data: Partial<{
      title: string;
      subject: string;
      description: string;
      endAt: Date | null;
    }>,
  ): Promise<Lecture> {
    return await this.prisma.lecture.update({
      where: { id, deletedAt: null },
      data,
    });
  }

  /** 강의 soft delete */
  async softDelete(id: string): Promise<void> {
    await this.prisma.lecture.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
