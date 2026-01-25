import { Lecture, PrismaClient } from '../generated/prisma/client.js';
import {
  NotFoundException,
  ForbiddenException,
} from '../err/http.exception.js';
import { LecturesRepository } from '../repos/lectures.repo.js';
import {
  CreateLectureDto,
  GetLecturesQueryDto,
  UpdateLectureDto,
} from '../validations/lectures.validation.js';

export class LecturesService {
  constructor(
    private readonly lecturesRepository: LecturesRepository,
    private readonly prisma: PrismaClient,
  ) {}

  /** 강의 생성 */
  async createLecture(
    instructorId: string,
    data: CreateLectureDto,
  ): Promise<Lecture> {
    const instructor =
      await this.lecturesRepository.findInstructorById(instructorId);

    if (!instructor) throw new NotFoundException('강사를 찾을 수 없습니다.');

    return await this.prisma.$transaction(async (tx) => {
      const lecture = await this.lecturesRepository.create(
        { ...data, instructorId },
        tx,
      );
      return lecture;
    });
  }

  /** 강의 리스트 조회 */
  async getLectures(instructorId: string, query: GetLecturesQueryDto) {
    const { page = 1, limit = 4, search } = query;

    const { lectures, totalCount } = await this.lecturesRepository.findMany({
      page,
      limit,
      instructorId,
      search,
    });

    return {
      lectures,
      pagination: {
        totalCount,
        totalPage: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1,
      },
    };
  }

  /** 강의 개별 조회 */
  async getLectureById(instructorId: string, id: string): Promise<Lecture> {
    const lecture = await this.lecturesRepository.findByIdWithRelations(id);

    if (!lecture) throw new NotFoundException('강의를 찾을 수 없습니다.');

    if (lecture.instructorId !== instructorId) {
      throw new ForbiddenException('해당 강의를 조회할 권한이 없습니다.');
    }

    return lecture;
  }

  /** 강의 수정 */
  async updateLecture(
    instructorId: string,
    id: string,
    data: UpdateLectureDto,
  ): Promise<Lecture> {
    const lecture = await this.lecturesRepository.findById(id);

    if (!lecture) throw new NotFoundException('강의를 찾을 수 없습니다.');
    if (lecture.instructorId !== instructorId)
      throw new ForbiddenException('해당 강의를 수정할 권한이 없습니다.');

    // undefined를 제외한 필드만 추출
    const updatePayload = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined),
    );

    return await this.lecturesRepository.update(id, updatePayload);
  }

  /** 강의 삭제 (Soft Delete) */
  async deleteLecture(id: string, instructorId: string): Promise<void> {
    const lecture = await this.lecturesRepository.findById(id);

    if (!lecture) throw new NotFoundException('강의를 찾을 수 없습니다.');

    if (lecture.instructorId !== instructorId)
      throw new ForbiddenException('해당 강의를 삭제할 권한이 없습니다.');

    await this.lecturesRepository.softDelete(id);
  }
}
