import { Request, Response, NextFunction } from 'express';
import { EnrollmentsService } from '../services/enrollments.service.js';
import {
  GetEnrollmentsQueryDto,
  GetSvcEnrollmentsQueryDto,
} from '../validations/enrollments.validation.js';
import { getPagingData } from '../utils/pagination.util.js';
import { UserType } from '../constants/auth.constant.js';
import { UnauthorizedException } from '../err/http.exception.js';

export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  /** GET: 수강 목록 조회 핸들러 */
  getEnrollments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userType = req.user?.userType;
      const profileId = req.profile?.id;

      if (!profileId || !userType) {
        throw new UnauthorizedException('사용자 프로필을 찾을 수 없습니다.');
      }

      // 강사/조교인 경우 (관리자 페이지 등에서 호출 시)
      if (userType === UserType.INSTRUCTOR || userType === UserType.ASSISTANT) {
        const query = req.query as unknown as GetEnrollmentsQueryDto;
        const { enrollments, totalCount } =
          await this.enrollmentsService.getEnrollmentsByInstructor(
            userType,
            profileId,
            query,
          );

        const responseData = getPagingData(
          enrollments,
          totalCount,
          query.page,
          query.limit,
        );

        res.status(200).json({
          status: 'success',
          data: responseData,
        });
        return;
      }

      // 학생/학부모인 경우
      const query = req.query as unknown as GetSvcEnrollmentsQueryDto;
      const { enrollments, totalCount } =
        await this.enrollmentsService.getEnrollments(
          userType,
          profileId,
          query,
        );

      const responseData = getPagingData(
        enrollments,
        totalCount,
        query.page,
        query.limit,
      );

      res.status(200).json({
        success: true, // Existing format used success: true. Instructor used status: 'success'. Keeping consistency with existing block.
        data: responseData,
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

      let enrollment;

      // 강사/조교인 경우
      if (userType === UserType.INSTRUCTOR || userType === UserType.ASSISTANT) {
        enrollment = await this.enrollmentsService.getEnrollmentDetail(
          enrollmentId,
          userType,
          profileId,
        );
      } else {
        // 학생/학부모인 경우
        enrollment = await this.enrollmentsService.getEnrollmentById(
          enrollmentId,
          userType,
          profileId,
        );
      }

      res.status(200).json({
        success: true,
        data: { enrollment },
        message: '수강 상세 조회 성공',
      });
    } catch (error) {
      next(error);
    }
  };

  /** [NEW] Enrollment 생성 */
  createEnrollment = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { lectureId } = req.params;
      const userType = req.user?.userType;
      const profileId = req.profile?.id;
      const body = req.body;

      if (!profileId || !userType) {
        throw new UnauthorizedException('사용자 프로필을 찾을 수 없습니다.');
      }

      const enrollment = await this.enrollmentsService.createEnrollment(
        lectureId,
        body,
        userType,
        profileId,
      );

      res.status(201).json({ status: 'success', data: { enrollment } });
    } catch (error) {
      next(error);
    }
  };

  /** [NEW] 강의별 Enrollment 목록 조회 */
  getEnrollmentsByLecture = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { lectureId } = req.params;
      const userType = req.user?.userType;
      const profileId = req.profile?.id;

      if (!profileId || !userType) {
        throw new UnauthorizedException('사용자 프로필을 찾을 수 없습니다.');
      }

      const enrollments =
        await this.enrollmentsService.getEnrollmentsByLectureId(
          lectureId,
          userType,
          profileId,
        );

      res.status(200).json({ status: 'success', data: { enrollments } });
    } catch (error) {
      next(error);
    }
  };

  /** [NEW] Enrollment 수정 */
  updateEnrollment = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { enrollmentId } = req.params;
      const userType = req.user?.userType;
      const profileId = req.profile?.id;
      const body = req.body;

      if (!profileId || !userType) {
        throw new UnauthorizedException('사용자 프로필을 찾을 수 없습니다.');
      }

      const enrollment = await this.enrollmentsService.updateEnrollment(
        enrollmentId,
        body,
        userType,
        profileId,
      );

      res.status(200).json({ status: 'success', data: { enrollment } });
    } catch (error) {
      next(error);
    }
  };

  /** [NEW] Enrollment 삭제 (Soft Delete) */
  deleteEnrollment = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { enrollmentId } = req.params;
      const userType = req.user?.userType;
      const profileId = req.profile?.id;

      if (!profileId || !userType) {
        throw new UnauthorizedException('사용자 프로필을 찾을 수 없습니다.');
      }

      await this.enrollmentsService.deleteEnrollment(
        enrollmentId,
        userType,
        profileId,
      );

      res
        .status(200)
        .json({ status: 'success', message: '수강 정보가 삭제되었습니다.' });
    } catch (error) {
      next(error);
    }
  };
}
