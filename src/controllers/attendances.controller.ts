import { Request, Response, NextFunction } from 'express';
import { AttendancesService } from '../services/attendances.service.js';
import { UnauthorizedException } from '../err/http.exception.js';
import {
  CreateBulkAttendancesDto,
  CreateAttendanceDto,
  UpdateAttendanceDto,
} from '../validations/attendances.validation.js';

export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  // 강의 내 단체 출결 등록
  createBulkAttendances = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { lectureId } = req.params;
      const userType = req.user?.userType;
      const profileId = req.profile?.id;
      const body = req.body as CreateBulkAttendancesDto;

      if (!profileId || !userType) {
        throw new UnauthorizedException('사용자 프로필을 찾을 수 없습니다.');
      }

      const results = await this.attendancesService.createBulkAttendances(
        lectureId,
        body.attendances,
        userType,
        profileId,
      );

      res.status(201).json({
        status: 'success',
        data: {
          count: results.length,
          attendances: results,
        },
        message: '출결이 성공적으로 등록되었습니다.',
      });
    } catch (error) {
      next(error);
    }
  };

  // 수강생 출결 등록 (단일)
  createAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { enrollmentId } = req.params;
      const userType = req.user?.userType;
      const profileId = req.profile?.id;
      const body = req.body as CreateAttendanceDto;

      if (!profileId || !userType) {
        throw new UnauthorizedException('사용자 프로필을 찾을 수 없습니다.');
      }

      const attendance = await this.attendancesService.createAttendance(
        enrollmentId,
        body,
        userType,
        profileId,
      );

      res.status(201).json({
        status: 'success',
        data: { attendance },
        message: '출결이 등록되었습니다.',
      });
    } catch (error) {
      next(error);
    }
  };

  // 수강생 출결 조회 + 통계
  getAttendances = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { enrollmentId } = req.params;
      const userType = req.user?.userType;
      const profileId = req.profile?.id;

      if (!profileId || !userType) {
        throw new UnauthorizedException('사용자 프로필을 찾을 수 없습니다.');
      }

      const { attendances, stats } =
        await this.attendancesService.getAttendancesByEnrollment(
          enrollmentId,
          userType,
          profileId,
        );

      res.status(200).json({
        status: 'success',
        data: {
          stats,
          attendances,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // 출결 수정
  updateAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // route: /:enrollmentId/attendances/:attendanceId
      const { enrollmentId, attendanceId } = req.params;
      const userType = req.user?.userType;
      const profileId = req.profile?.id;
      const body = req.body as UpdateAttendanceDto;

      if (!profileId || !userType) {
        throw new UnauthorizedException('사용자 프로필을 찾을 수 없습니다.');
      }

      const attendance = await this.attendancesService.updateAttendance(
        enrollmentId,
        attendanceId,
        body,
        userType,
        profileId,
      );

      res.status(200).json({
        status: 'success',
        data: { attendance },
        message: '출결 정보가 수정되었습니다.',
      });
    } catch (error) {
      next(error);
    }
  };
}
