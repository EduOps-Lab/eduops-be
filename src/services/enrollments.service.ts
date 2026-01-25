import { UserType } from '../constants/auth.constant.js';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '../err/http.exception.js';
import type { PrismaClient } from '../generated/prisma/client.js';
import { EnrollmentsRepository } from '../repos/enrollments.repo.js';
import crypto from 'crypto';

/** 임시 토큰 캐시 (실제로는 Redis 사용 권장) */
const tempTokenStore = new Map<
  string,
  { phoneNumber: string; userType: UserType; expiresAt: Date }
>();

export class EnrollmentsService {
  constructor(
    private readonly enrollmentsRepository: EnrollmentsRepository,
    private readonly prisma: PrismaClient,
  ) {}

  /** 수강 목록 조회 */
  async getEnrollments(userType: UserType, profileId: string) {
    let enrollments;

    /**  userType에 따라 수강 목록 조회*/
    if (userType === UserType.STUDENT) {
      //  appStudentId로 조회
      enrollments =
        await this.enrollmentsRepository.findByAppStudentId(profileId);
    } else if (userType === UserType.PARENT) {
      // appParentId로 ParentChildLink 을 찾고 각 link의 ID로 enrollments 조회 후 병합
      enrollments =
        await this.enrollmentsRepository.findByAppParentId(profileId);
    } else {
      throw new ForbiddenException('해당 수강 정보에 접근할 권한이 없습니다.');
    }

    return {
      enrollments,
    };
  }

  /** Enrollment 상세 조회 */
  async getEnrollmentById(
    enrollmentId: string,
    userType: UserType,
    profileId: string,
  ) {
    const enrollment =
      await this.enrollmentsRepository.findByIdWithRelations(enrollmentId);

    if (!enrollment || enrollment.deletedAt) {
      throw new NotFoundException('수강 정보를 찾을 수 없습니다.');
    }

    /** userType에 따른 권한 체크 */
    let hasPermission = false;

    if (userType === UserType.STUDENT) {
      hasPermission = enrollment.appStudentId === profileId;
    } else if (userType === UserType.PARENT) {
      // 학부모인 경우 ParentChildLink를 통해 확인
      hasPermission = enrollment.appParentLinkId
        ? await this.checkParentPermission(
            profileId,
            enrollment.appParentLinkId,
          )
        : false;
    }

    if (!hasPermission) {
      throw new ForbiddenException('해당 수강 정보에 접근할 권한이 없습니다.');
    }

    return enrollment;
  }

  //=============================== 전화번호 기반 조회 (미가입 사용자) ================================

  /** 학생 ID로 수강 목록 조회 */
  async getEnrollmentsByStudentId(appStudentId: string) {
    const enrollments =
      await this.enrollmentsRepository.findByAppStudentId(appStudentId);
    return { enrollments };
  }

  /** 학부모 ID로 수강 목록 조회 */
  async getEnrollmentsByParentId(appParentId: string) {
    const enrollments =
      await this.enrollmentsRepository.findByAppParentId(appParentId);
    return { enrollments };
  }

  /** Enrollment 상세 조회 (권한 체크 포함) */
  async getEnrollmentByIdForUser(
    enrollmentId: string,
    userType: UserType,
    profileId: string,
  ) {
    const enrollment =
      await this.enrollmentsRepository.findByIdWithRelations(enrollmentId);

    if (!enrollment || enrollment.deletedAt) {
      throw new NotFoundException('수강 정보를 찾을 수 없습니다.');
    }

    // 권한 체크
    let hasPermission = false;

    if (userType === UserType.STUDENT) {
      hasPermission = enrollment.appStudentId === profileId;
    } else if (userType === UserType.PARENT) {
      // 학부모의 경우 ParentChildLink 확인
      if (enrollment.appParentLinkId) {
        const link =
          await this.enrollmentsRepository.findParentIdByParentChildLinkId(
            enrollment.appParentLinkId,
          );
        hasPermission = link?.appParentId === profileId;
      }
    }

    if (!hasPermission) {
      throw new ForbiddenException('해당 수강 정보에 접근할 권한이 없습니다.');
    }

    return enrollment;
  }

  async requestPhoneVerification(phoneNumber: string, userType: UserType) {
    // 해당 전화번호로 enrollment가 있는지 확인
    const hasEnrollment =
      await this.enrollmentsRepository.checkPhoneHasEnrollments(
        phoneNumber,
        userType,
      );

    if (!hasEnrollment) {
      throw new NotFoundException(
        '해당 전화번호로 등록된 수강 정보를 찾을 수 없습니다.',
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // DB에 저장 (트렌젝션 을 사용하기에 이대로 코드를 작성)
    await this.prisma.verificationCode.create({
      data: {
        targetPhone: phoneNumber,
        code: code,
        type: 'ENROLLMENT_ACCESS',
        expiresAt: new Date(Date.now() + 1000 * 60 * 5), // 5분 유효
      },
    });

    console.log(
      `${phoneNumber} 전화번호로 인증 코드 ${code}가 발송되었습니다.`,
    );

    return true;
  }

  /** 인증 코드 확인 및 임시 토큰 발급 */
  async confirmPhoneVerification(
    code: string,
    phoneNumber: string,
    userType: UserType,
  ): Promise<string> {
    const verification = await this.prisma.verificationCode.findFirst({
      where: {
        targetPhone: phoneNumber,
        code,
        type: 'ENROLLMENT_ACCESS',
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      throw new BadRequestException('인증 코드가 유효하지 않습니다.');
    }

    // 인증 코드 삭제 (일회용)
    await this.prisma.verificationCode.delete({
      where: { id: verification.id },
    });

    // 임시 토큰 생성
    const tempToken = crypto.randomBytes(32).toString('hex');

    // 임시 토큰 저장 (30분 유효)
    tempTokenStore.set(tempToken, {
      phoneNumber,
      userType,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    return tempToken;
  }

  /** 임시 토큰으로 수강 목록 조회 */
  async getEnrollmentsByTempToken(tempToken: string) {
    const tokenData = tempTokenStore.get(tempToken);

    if (!tokenData || tokenData.expiresAt < new Date()) {
      tempTokenStore.delete(tempToken);
      throw new UnauthorizedException('인증 토큰이 만료되었습니다.');
    }

    const { phoneNumber, userType } = tokenData;

    let enrollments;
    if (userType === UserType.STUDENT) {
      enrollments =
        await this.enrollmentsRepository.findByStudentPhone(phoneNumber);
    } else if (userType === UserType.PARENT) {
      enrollments =
        await this.enrollmentsRepository.findByParentPhone(phoneNumber);
    } else {
      throw new BadRequestException('유효하지 않은 사용자 유형입니다.');
    }

    return { enrollments };
  }

  /** 임시 토큰으로 수강 상세 조회 */
  async getEnrollmentByIdForTempToken(enrollmentId: string, tempToken: string) {
    const tokenData = tempTokenStore.get(tempToken);

    if (!tokenData || tokenData.expiresAt < new Date()) {
      tempTokenStore.delete(tempToken);
      throw new UnauthorizedException('인증 토큰이 만료되었습니다.');
    }

    const { phoneNumber, userType } = tokenData;

    const enrollment =
      await this.enrollmentsRepository.findByIdWithRelations(enrollmentId);

    if (!enrollment || enrollment.deletedAt) {
      throw new NotFoundException('수강 정보를 찾을 수 없습니다.');
    }

    // 권한 체크: 전화번호 일치 확인
    let hasPermission = false;

    if (userType === UserType.STUDENT) {
      hasPermission = enrollment.studentPhone === phoneNumber;
    } else if (userType === UserType.PARENT) {
      hasPermission = enrollment.parentPhone === phoneNumber;
    }

    if (!hasPermission) {
      throw new ForbiddenException('해당 수강 정보에 접근할 권한이 없습니다.');
    }

    return enrollment;
  }

  /** -------- Helper Functions -------- */

  /** 학부모 권한 체크 */
  private async checkParentPermission(
    appParentId: string,
    appParentLinkId: string,
  ): Promise<boolean> {
    const link =
      await this.enrollmentsRepository.findParentIdByParentChildLinkId(
        appParentLinkId,
      );
    return link?.appParentId === appParentId;
  }
}
