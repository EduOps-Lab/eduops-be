import { Request, Response, NextFunction } from 'express';
import { EnrollmentsService } from '../services/enrollments.service.js';
import { UnauthorizedException } from '../err/http.exception.js';
import { UserType } from '../constants/auth.constant.js';

export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  /**GET: 수강 목록 조회 핸들러*/
  getEnrollments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userType = req.user?.userType;
      const profileId = req.profile?.id;

      if (!profileId || !userType) {
        throw new UnauthorizedException('사용자 프로필을 찾을 수 없습니다.');
      }

      const result = await this.enrollmentsService.getEnrollments(
        userType,
        profileId,
      );

      res.status(200).json({
        success: true,
        data: result,
        message: '수강 목록 조회 성공',
      });
    } catch (error) {
      next(error);
    }
  };

  /** GET: 수강 상세 조회 핸들러 */
  getEnrollment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { enrollmentId } = req.params;
      const userType = req.user?.userType;
      const profileId = req.profile?.id;

      if (!profileId || !userType) {
        throw new UnauthorizedException('사용자 프로필을 찾을 수 없습니다.');
      }

      const enrollment = await this.enrollmentsService.getEnrollmentById(
        enrollmentId,
        userType,
        profileId,
      );

      res.status(200).json({
        success: true,
        data: enrollment,
        message: '수강 상세 조회 성공',
      });
    } catch (error) {
      next(error);
    }
  };

  // ================================ 전화번호 기반 조회 (미가입 사용자) ================================

  /** POST: 전화번호로 인증 코드 요청 */
  requestPhoneVerification = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { phoneNumber, userType } = req.body;
      const result = await this.enrollmentsService.requestPhoneVerification(
        phoneNumber,
        userType,
      );

      res.status(200).json({
        success: true,
        data: result,
        message: '인증 코드가 발송되었습니다.',
      });
    } catch (error) {
      next(error);
    }
  };

  /** POST: 전화번호로 인증 코드 검증 */
  confirmPhoneVerification = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { code, phoneNumber, userType } = req.body;
      const tempToken = await this.enrollmentsService.confirmPhoneVerification(
        code,
        phoneNumber,
        userType,
      );

      res.status(200).json({
        success: true,
        data: tempToken,
        message: '인증이 완료되었습니다.',
      });
    } catch (error) {
      next(error);
    }
  };

  /** GET: 전화번호로 수강 목록 조회 */
  getEnrollmentsByPhone = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { tempToken } = req.query;

      // optionalAuth: 로그인한 경우 profile 사용, 아니면 tempToken 사용
      if (req.user && req.profile) {
        const result =
          req.user.userType === UserType.STUDENT
            ? await this.enrollmentsService.getEnrollmentsByStudentId(
                req.profile.id,
              )
            : await this.enrollmentsService.getEnrollmentsByParentId(
                req.profile.id,
              );

        return res.status(200).json({
          success: true,
          data: result,
          message: '수강 목록 조회 성공',
        });
      }

      // 미가입 사용자 tempToken 필요
      if (!tempToken || typeof tempToken !== 'string') {
        throw new UnauthorizedException('인증이 필요합니다.');
      }

      const result =
        await this.enrollmentsService.getEnrollmentsByTempToken(tempToken);

      res.status(200).json({
        success: true,
        data: result,
        message: '수강 목록 조회 성공',
      });
    } catch (error) {
      next(error);
    }
  };

  /** GET: 전화번호로 수강 상세 조회 */
  getEnrollmentByPhone = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { enrollmentId } = req.params;
      const { tempToken } = req.query;

      if (req.user && req.profile) {
        const enrollment =
          await this.enrollmentsService.getEnrollmentByIdForUser(
            enrollmentId,
            req.user.userType,
            req.profile.id,
          );

        return res.status(200).json({
          success: true,
          data: enrollment,
          message: '수강 상세 조회 성공',
        });
      }

      //미가입 사용자 tempToken 필요
      if (!tempToken || typeof tempToken !== 'string') {
        throw new UnauthorizedException('인증이 필요합니다.');
      }

      const enrollment =
        await this.enrollmentsService.getEnrollmentByIdForTempToken(
          enrollmentId,
          tempToken,
        );

      res.status(200).json({
        success: true,
        data: enrollment,
        message: '수강 상세 조회 성공',
      });
    } catch (error) {
      next(error);
    }
  };
}
