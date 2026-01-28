import { Request, Response, NextFunction } from 'express';
import { ParentsService } from '../services/parents.service.js';
import { UserType } from '../constants/auth.constant.js';
import type { GetSvcEnrollmentsQueryDto } from '../validations/enrollments.validation.js';
import { getPagingData } from '../utils/pagination.util.js';
import { getAuthUser } from '../utils/user.util.js';

export class ChildrenController {
  constructor(private readonly parentsService: ParentsService) {}

  /**
   * POST /api/svc/v1/children
   * 자녀 등록
   */
  registerChild = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getAuthUser(req);
      const child = await this.parentsService.registerChild(
        user.userType as UserType,
        user.id,
        req.body,
      );

      res.status(201).json(child);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/svc/v1/children
   * 자녀 목록 조회
   */
  getChildren = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getAuthUser(req);
      const children = await this.parentsService.getChildren(
        user.userType as UserType,
        user.id,
      );

      res.status(200).json(children);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/svc/v1/children/:id/enrollments
   * 자녀 수강 목록 조회
   */
  getChildEnrollments = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const user = getAuthUser(req);
      const { id } = req.params;
      const query = req.query as unknown as GetSvcEnrollmentsQueryDto;

      const { enrollments, totalCount } =
        await this.parentsService.getChildEnrollments(
          user.userType as UserType,
          user.id,
          id,
          query,
        );

      const responseData = getPagingData(
        enrollments,
        totalCount,
        query.page,
        query.limit,
      );

      res.status(200).json(responseData);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/svc/v1/children/:id/enrollments/:enrollmentId
   * 자녀 수강 상세 조회
   */
  getChildEnrollmentDetail = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const user = getAuthUser(req);
      const { id, enrollmentId } = req.params;
      const enrollment = await this.parentsService.getChildEnrollmentDetail(
        user.userType as UserType,
        user.id,
        id,
        enrollmentId,
      );

      res.status(200).json(enrollment);
    } catch (error) {
      next(error);
    }
  };
}
