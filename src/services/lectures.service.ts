import { Lecture } from '../generated/prisma/client.js';
import { NotFoundException } from '../err/http.exception.js';
import { LecturesRepository } from '../repos/lectures.repo.js';
import { CreateLectureDto } from '../validations/lectures.validation.js';

export class LecturesService {
  private lecturesRepository: LecturesRepository;

  constructor() {
    this.lecturesRepository = new LecturesRepository();
  }

  /**
   * 강의 생성
   * @throws {NotFoundException} 강사가 존재하지 않는 경우
   */
  async createLecture(data: CreateLectureDto): Promise<Lecture> {
    // 1. 강사 존재 여부 확인
    const instructor = await this.lecturesRepository.findInstructorById(
      data.instructorId,
    );

    if (!instructor) {
      throw new NotFoundException(
        `강사를 찾을 수 없습니다. (ID: ${data.instructorId})`,
      );
    }

    // 2. 강의 생성
    const lecture = await this.lecturesRepository.create(data);

    return lecture;
  }
}
