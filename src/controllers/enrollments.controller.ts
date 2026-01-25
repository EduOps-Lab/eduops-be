import { Request, Response, NextFunction } from 'express';
import { EnrollmentsService } from '../services/enrollments.service.js';
import { UnauthorizedException } from '../err/http.exception.js';

export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  /**GET: 수강 목록 조회 핸들러*/
  getEnrollments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userType = req.user!.userType;
      const profileId = req.profile?.id;

      if (!profileId) {
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
      const userType = req.user!.userType;
      const profileId = req.profile?.id;

      if (!profileId) {
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
}
