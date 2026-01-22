import { Lecture } from '../generated/prisma/client.js';
import { NotFoundException } from '../err/http.exception.js';
import { LecturesRepository } from '../repos/lectures.repo.js';
import {
  CreateLectureDto,
  GetLecturesQueryDto,
} from '../validations/lectures.validation.js';

export class LecturesService {
  private lecturesRepository: LecturesRepository;

  constructor() {
    this.lecturesRepository = new LecturesRepository();
  }

  /** 강의 생성 */
  async createLecture(data: CreateLectureDto): Promise<Lecture> {
    const instructor = await this.lecturesRepository.findInstructorById(
      data.instructorId,
    );

    if (!instructor) {
      throw new NotFoundException(
        `강사를 찾을 수 없습니다. (ID: ${data.instructorId})`,
      );
    }

    const lecture = await this.lecturesRepository.create(data);

    return lecture;
  }

  /** 강의 리스트 조회 */
  async getLectures(query: GetLecturesQueryDto): Promise<{
    lectures: Lecture[];
    nextCursor: string | null;
  }> {
    const { cursor, limit } = query;

    const lectures = await this.lecturesRepository.findMany({
      cursor,
      limit,
    });

    const hasNextPage = lectures.length > limit;

    const resultLectures = hasNextPage ? lectures.slice(0, limit) : lectures;

    // nextCursor 계산: limit보다 많이 조회되면 마지막 항목을 제거하고 그 ID를 커서로 사용
    const nextCursor = hasNextPage ? lectures[limit - 1].id : null;

    return {
      lectures: resultLectures,
      nextCursor: nextCursor,
    };
  }

  /** 강의 개별 조회 */
  async getLectureById(id: string): Promise<Lecture> {
    const lecture = await this.lecturesRepository.findByIdWithRelations(id);

    if (!lecture) {
      throw new NotFoundException(`강의를 찾을 수 없습니다. (ID: ${id})`);
    }

    return lecture;
  }
}
