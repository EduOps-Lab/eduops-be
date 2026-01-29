import { PrismaClient } from '../generated/prisma/client.js';
import { UserType } from '../constants/auth.constant.js';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '../err/http.exception.js';
import { ParentRepository } from '../repos/parent.repo.js';
import { ParentChildLinkRepository } from '../repos/parent-child-link.repo.js';
import { EnrollmentsRepository } from '../repos/enrollments.repo.js';
import type { CreateChildDto } from '../validations/children.validation.js';
import type { GetSvcEnrollmentsQueryDto } from '../validations/enrollments.validation.js';

export class ParentsService {
  constructor(
    private readonly parentRepository: ParentRepository,
    private readonly parentChildLinkRepository: ParentChildLinkRepository,
    private readonly enrollmentsRepository: EnrollmentsRepository,
    private readonly prisma: PrismaClient,
  ) {}

  /**
   * 자녀 등록 (및 기존 수강 내역 자동 연결)
   */
  async registerChild(
    userType: UserType,
    profileId: string,
    data: CreateChildDto,
  ) {
    if (userType !== UserType.PARENT) {
      throw new ForbiddenException('학부모만 자녀를 등록할 수 있습니다.');
    }

    // 1. 이미 등록된 자녀인지 확인 (동일 부모 - 동일 번호)
    const existingLink =
      await this.parentChildLinkRepository.findByParentIdAndPhoneNumber(
        profileId,
        data.phoneNumber,
      );

    if (existingLink) {
      throw new BadRequestException('이미 등록된 자녀 번호입니다.');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 2. ParentChildLink 생성
      const newLink = await this.parentChildLinkRepository.create(
        {
          appParentId: profileId,
          name: data.name,
          phoneNumber: data.phoneNumber,
        },
        tx,
      );

      // 3. 기존 Enrollment 중 해당 자녀 번호로 된 것들을 찾아 자동 연결 (Backfill)
      await this.enrollmentsRepository.updateAppParentLinkIdByStudentPhone(
        data.phoneNumber,
        newLink.id,
        tx,
      );

      return newLink;
    });
  }

  /**
   * 내 자녀 목록 조회
   */
  async getChildren(userType: UserType, profileId: string) {
    if (userType !== UserType.PARENT) {
      throw new ForbiddenException('학부모만 자녀 목록을 조회할 수 있습니다.');
    }

    return await this.parentChildLinkRepository.findByAppParentId(profileId);
  }

  /**
   * 자녀의 수강 목록 조회
   */
  async getChildEnrollments(
    userType: UserType,
    profileId: string,
    childId: string,
    query?: GetSvcEnrollmentsQueryDto,
  ) {
    // 1. 자녀 링크 검증
    const childLink = await this.validateChildAccess(
      userType,
      profileId,
      childId,
    );

    // 2. 해당 링크 ID로 수강 목록 조회
    const result = await this.enrollmentsRepository.findByAppParentLinkId(
      childLink.id,
      query,
    );

    return {
      enrollments: result.enrollments,
      totalCount: result.totalCount,
    };
  }

  /**
   * 자녀의 수강 상세 조회
   */
  async getChildEnrollmentDetail(
    userType: UserType,
    profileId: string,
    childId: string,
    enrollmentId: string,
  ) {
    // 1. 자녀 링크 검증
    const childLink = await this.validateChildAccess(
      userType,
      profileId,
      childId,
    );

    // 2. 수강 상세 조회
    const enrollment =
      await this.enrollmentsRepository.findByIdWithRelations(enrollmentId);

    if (!enrollment) {
      throw new NotFoundException('수강 정보를 찾을 수 없습니다.');
    }

    // 3. 해당 수강 정보가 내 자녀의 것이 맞는지 확인
    // (enrollment.appParentLinkId가 childLink.id와 일치해야 함)
    if (enrollment.appParentLinkId !== childLink.id) {
      throw new ForbiddenException(
        '해당 자녀의 수강 정보가 아니거나 접근 권한이 없습니다.',
      );
    }

    return enrollment;
  }

  /**
   * 자녀 접근 권한 검증 (Helper)
   */
  private async validateChildAccess(
    userType: UserType,
    profileId: string,
    childId: string,
  ) {
    if (userType !== UserType.PARENT) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    const childLink = await this.parentChildLinkRepository.findById(childId);
    if (!childLink) {
      throw new NotFoundException('자녀 정보를 찾을 수 없습니다.');
    }

    if (childLink.appParentId !== profileId) {
      throw new ForbiddenException('본인의 자녀만 조회할 수 있습니다.');
    }

    return childLink;
  }
}
