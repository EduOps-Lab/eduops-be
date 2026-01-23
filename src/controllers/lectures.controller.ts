import { Request, Response, NextFunction } from 'express';
import { LecturesService } from '../services/lectures.service.js';
import {
  CreateLectureDto,
  GetLecturesQueryDto,
  LectureIdParamDto,
  UpdateLectureDto,
  DeleteLectureDto,
} from '../validations/lectures.validation.js';

export class LecturesController {
  private lecturesService: LecturesService;

  constructor() {
    this.lecturesService = new LecturesService();
  }

  /** POST:강의 생성 핸들러 */
  create = async (
    req: Request<object, object, CreateLectureDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const lectureData = req.body;
      const lecture = await this.lecturesService.createLecture(lectureData);

      res.status(201).json(lecture);
    } catch (error) {
      next(error);
    }
  };

  /** GET:강의 리스트 조회 핸들러 */
  list = async (
    req: Request<object, object, GetLecturesQueryDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { cursor, limit, instructorId } = req.query;

      //  타입변환
      const queryDto = {
        cursor: cursor ? String(cursor) : undefined,
        limit: limit ? Number(limit) : 10,
        instructorId: instructorId ? String(instructorId) : undefined,
      };

      const result = await this.lecturesService.getLectures(queryDto);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /** GET:강의 개별 조회 핸들러 */
  getById = async (
    req: Request<LectureIdParamDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const lecture = await this.lecturesService.getLectureById(id);

      res.status(200).json(lecture);
    } catch (error) {
      next(error);
    }
  };

  /** PATCH:강의 수정 핸들러 */
  update = async (
    req: Request<LectureIdParamDto, object, UpdateLectureDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const lecture = await this.lecturesService.updateLecture(id, updateData);

      res.status(200).json(lecture);
    } catch (error) {
      next(error);
    }
  };

  /** DELETE:강의 삭제 핸들러 (Soft Delete) */
  delete = async (
    req: Request<LectureIdParamDto, object, DeleteLectureDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { instructorId } = req.body;
      await this.lecturesService.deleteLecture(id, instructorId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
