import { Request, Response, NextFunction } from 'express';
import { ClinicsService } from '../services/clinics.service.js';
import { successResponse } from '../utils/response.util.js';
import { getAuthUser, getProfileIdOrThrow } from '../utils/user.util.js';
import { UserType } from '../constants/auth.constant.js';

export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  /** 클리닉 일괄 생성 핸들러 */
  createClinics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { examId } = req.params;
      const profileId = getProfileIdOrThrow(req);
      const user = getAuthUser(req);
      const userType = user.userType as UserType;
      const clinicData = req.body;

      const result = await this.clinicsService.createClinicsForFailedStudents(
        examId,
        clinicData,
        userType,
        profileId,
      );

      return successResponse(res, {
        statusCode: 201,
        data: result,
        message: '클리닉 생성 요청이 처리되었습니다.',
      });
    } catch (error) {
      next(error);
    }
  };
}
