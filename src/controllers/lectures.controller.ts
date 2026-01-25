import { Request, Response, NextFunction } from 'express';
import { LecturesService } from '../services/lectures.service.js';

export class LecturesController {
  constructor(private readonly lecturesService: LecturesService) {}

  /** POST:강의 생성 핸들러 */
  createLecture = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const instructorId = req.profile!.id;
      const lectureData = req.body;

      const lecture = await this.lecturesService.createLecture(
        instructorId,
        lectureData,
      );

      res
        .status(201)
        .json({ success: true, data: lecture, message: '강의 생성 성공' });
    } catch (error) {
      next(error);
    }
  };

  /** GET:강의 리스트 조회 핸들러 */
  getLectures = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search } = req.query;
      const instructorId = req.profile!.id;

      //  타입변환
      const result = await this.lecturesService.getLectures(instructorId, {
        page: Number(page) || 1,
        limit: Number(limit) || 4,
        search: search ? String(search) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: '강의 리스트 조회 성공',
      });
    } catch (error) {
      next(error);
    }
  };

  /** GET:강의 개별 조회 핸들러 */
  getLecture = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const instructorId = req.profile!.id;
      const { id } = req.params;
      const lecture = await this.lecturesService.getLectureById(
        instructorId,
        id,
      );

      res
        .status(200)
        .json({ success: true, data: lecture, message: '강의 개별 조회 성공' });
    } catch (error) {
      next(error);
    }
  };

  /** PATCH:강의 수정 핸들러 */
  updateLecture = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const instructorId = req.profile!.id;
      const updateData = req.body;
      const lecture = await this.lecturesService.updateLecture(
        instructorId,
        id,
        updateData,
      );

      res
        .status(200)
        .json({ success: true, data: lecture, message: '강의 수정 성공' });
    } catch (error) {
      next(error);
    }
  };

  /** DELETE:강의 삭제 핸들러 (Soft Delete) */
  deleteLecture = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const instructorId = req.profile!.id;
      const { id } = req.params;
      await this.lecturesService.deleteLecture(id, instructorId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
