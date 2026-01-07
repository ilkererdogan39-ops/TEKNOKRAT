import { videoProgressRepository } from "../repositories/videoProgressRepository";
import { assignmentRepository } from "../repositories/assignmentRepository";
import { type VideoWatchLog, type SaveVideoProgress } from "@shared/schema";
import { NotFoundError, ForbiddenError } from "../middleware/errorHandler";

export class VideoProgressService {
  async getByAssignmentId(assignmentId: string): Promise<VideoWatchLog | { watchedSeconds: number; progressPercent: number }> {
    const progress = await videoProgressRepository.findByAssignmentId(assignmentId);
    if (!progress) {
      return { watchedSeconds: 0, progressPercent: 0 };
    }
    return progress;
  }

  async save(data: SaveVideoProgress): Promise<VideoWatchLog> {
    const assignment = await assignmentRepository.findById(data.assignmentId);
    if (!assignment) {
      throw new NotFoundError("Atama bulunamadı");
    }
    if (assignment.participantId !== data.participantId) {
      throw new ForbiddenError("Bu işlem için yetkiniz yok");
    }
    
    const progress = await videoProgressRepository.save(data);
    await assignmentRepository.updateProgress(data.assignmentId, data.progressPercent);
    return progress;
  }

  async getLogs(assignmentId: string): Promise<VideoWatchLog[]> {
    return await videoProgressRepository.findLogsByAssignmentId(assignmentId);
  }
}

export const videoProgressService = new VideoProgressService();
