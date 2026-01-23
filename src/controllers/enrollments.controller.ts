import { Request, Response, NextFunction } from 'express';
import { EnrollmentsService } from '../services/enrollments.service.js';

export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  /**GET: 수강 목록 조회 핸들러*/
  getEnrollments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { appStudentId, appParentLinkId, studentPhone, parentPhone } =
        req.query;

      const result = await this.enrollmentsService.getEnrollments({
        appStudentId: appStudentId ? String(appStudentId) : undefined,
        appParentLinkId: appParentLinkId ? String(appParentLinkId) : undefined,
        studentPhone: studentPhone ? String(studentPhone) : undefined,
        parentPhone: parentPhone ? String(parentPhone) : undefined,
      });

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
      const { appStudentId, appParentLinkId, studentPhone, parentPhone } =
        req.query;

      const enrollment = await this.enrollmentsService.getEnrollmentById(
        enrollmentId,
        {
          appStudentId: appStudentId ? String(appStudentId) : undefined,
          appParentLinkId: appParentLinkId
            ? String(appParentLinkId)
            : undefined,
          studentPhone: studentPhone ? String(studentPhone) : undefined,
          parentPhone: parentPhone ? String(parentPhone) : undefined,
        },
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
