import {
  NotFoundException,
  ForbiddenException,
} from '../err/http.exception.js';
import { EnrollmentsRepository } from '../repos/enrollments.repo.js';
import {
  GetEnrollmentsQueryDto,
  GetEnrollmentDetailQueryDto,
} from '../validations/enrollments.validation.js';

export class EnrollmentsService {
  constructor(private readonly enrollmentsRepository: EnrollmentsRepository) {}

  /** 수강 목록 조회 */
  async getEnrollments(query: GetEnrollmentsQueryDto) {
    const { appStudentId, appParentLinkId } = query;

    let enrollments;

    if (appStudentId) {
      enrollments =
        await this.enrollmentsRepository.findByAppStudentId(appStudentId);
    } else if (appParentLinkId) {
      enrollments =
        await this.enrollmentsRepository.findByAppParentLinkId(appParentLinkId);
    } else {
      throw new Error('appStudentId 또는 appParentLinkId가 필요합니다.');
    }

    return {
      enrollments,
    };
  }

  /** Enrollment 상세 조회 */
  async getEnrollmentById(
    enrollmentId: string,
    userQuery: GetEnrollmentDetailQueryDto,
  ) {
    const enrollment =
      await this.enrollmentsRepository.findByIdWithRelations(enrollmentId);

    if (!enrollment) {
      throw new NotFoundException('수강 정보를 찾을 수 없습니다.');
    }

    // 삭제된 enrollment는 조회 불가
    if (enrollment.deletedAt) {
      throw new NotFoundException('수강 정보를 찾을 수 없습니다.');
    }

    // 권한 확인
    const { appStudentId, appParentLinkId } = userQuery;

    const hasPermission =
      (appStudentId && enrollment.appStudentId === appStudentId) ||
      (appParentLinkId && enrollment.appParentLinkId === appParentLinkId);

    if (!hasPermission) {
      throw new ForbiddenException('해당 수강 정보에 접근할 권한이 없습니다.');
    }

    return enrollment;
  }
}
