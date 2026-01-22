import { Request, Response, NextFunction } from 'express';
import { LecturesService } from '../services/lectures.service.js';
import { CreateLectureDto } from '../validations/lectures.validation.js';

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
}
