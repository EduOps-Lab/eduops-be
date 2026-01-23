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
    const { appStudentId, appParentLinkId, studentPhone, parentPhone } = query;

    let enrollments;

    if (appStudentId) {
      enrollments =
        await this.enrollmentsRepository.findByAppStudentId(appStudentId);
    } else if (appParentLinkId) {
      enrollments =
        await this.enrollmentsRepository.findByAppParentLinkId(appParentLinkId);
    } else if (studentPhone) {
      enrollments =
        await this.enrollmentsRepository.findByStudentPhone(studentPhone);
    } else if (parentPhone) {
      enrollments =
        await this.enrollmentsRepository.findByParentPhone(parentPhone);
    } else {
      throw new Error(
        'appStudentId, appParentLinkId, studentPhone, parentPhone 중 하나는 필수입니다.',
      );
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
    const { appStudentId, appParentLinkId, studentPhone, parentPhone } =
      userQuery;

    const hasPermission =
      (appStudentId && enrollment.appStudentId === appStudentId) ||
      (appParentLinkId && enrollment.appParentLinkId === appParentLinkId) ||
      (studentPhone && enrollment.studentPhone === studentPhone) ||
      (parentPhone && enrollment.parentPhone === parentPhone);

    if (!hasPermission) {
      throw new ForbiddenException('해당 수강 정보에 접근할 권한이 없습니다.');
    }

    return enrollment;
  }
}
