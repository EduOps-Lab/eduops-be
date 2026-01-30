import { Request, Response, NextFunction } from 'express';
import { AttendancesService } from '../services/attendances.service.js';
import {
  CreateBulkAttendancesDto,
  CreateAttendanceDto,
  UpdateAttendanceDto,
} from '../validations/attendances.validation.js';
import { successResponse } from '../utils/response.util.js';
import { getAuthUser, getProfileIdOrThrow } from '../utils/user.util.js';
import { UserType } from '../constants/auth.constant.js';

export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  /** 강의 내 단체 출결 등록 (배열) */
  createBulkAttendances = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { lectureId } = req.params;
      const user = getAuthUser(req);
      const profileId = getProfileIdOrThrow(req);
      const userType = user.userType as UserType;
      const body = req.body as CreateBulkAttendancesDto;

      const results = await this.attendancesService.createBulkAttendances(
        lectureId,
        body.attendances,
        userType,
        profileId,
      );

      return successResponse(res, {
        statusCode: 201,
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

  /** 수강생 출결 등록 (단일) */
  createAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { enrollmentId } = req.params;
      const user = getAuthUser(req);
      const profileId = getProfileIdOrThrow(req);
      const userType = user.userType as UserType;
      const body = req.body as CreateAttendanceDto;

      const attendance = await this.attendancesService.createAttendance(
        enrollmentId,
        body,
        userType,
        profileId,
      );

      return successResponse(res, {
        statusCode: 201,
        data: { attendance },
        message: '출결이 등록되었습니다.',
      });
    } catch (error) {
      next(error);
    }
  };

  /** 수강생 출결 조회 + 통계 */
  getAttendances = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { enrollmentId } = req.params;
      const user = getAuthUser(req);
      const profileId = getProfileIdOrThrow(req);
      const userType = user.userType as UserType;

      const { attendances, stats } =
        await this.attendancesService.getAttendancesByEnrollment(
          enrollmentId,
          userType,
          profileId,
        );

      return successResponse(res, {
        data: {
          stats,
          attendances,
        },
        message: '출결 목록 조회 성공',
      });
    } catch (error) {
      next(error);
    }
  };

  /** 출결 수정 */
  updateAttendance = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // route: /:enrollmentId/attendances/:attendanceId
      const { enrollmentId, attendanceId } = req.params;
      const user = getAuthUser(req);
      const profileId = getProfileIdOrThrow(req);
      const userType = user.userType as UserType;
      const body = req.body as UpdateAttendanceDto;

      const attendance = await this.attendancesService.updateAttendance(
        enrollmentId,
        attendanceId,
        body,
        userType,
        profileId,
      );

      return successResponse(res, {
        data: { attendance },
        message: '출결 정보가 수정되었습니다.',
      });
    } catch (error) {
      next(error);
    }
  };
}
