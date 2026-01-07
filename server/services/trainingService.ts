import { trainingRepository } from "../repositories/trainingRepository";
import { assignmentRepository } from "../repositories/assignmentRepository";
import { type Training, type InsertTraining, type TrainingAssignment } from "@shared/schema";
import { NotFoundError } from "../middleware/errorHandler";

export class TrainingService {
  async getAll(): Promise<Training[]> {
    return await trainingRepository.findAll();
  }

  async getById(id: string): Promise<Training> {
    const training = await trainingRepository.findById(id);
    if (!training) {
      throw new NotFoundError("Eğitim bulunamadı");
    }
    return training;
  }

  async create(data: InsertTraining): Promise<Training> {
    return await trainingRepository.create(data);
  }

  async delete(id: string): Promise<void> {
    await assignmentRepository.deleteByTrainingId(id);
    const deleted = await trainingRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError("Eğitim bulunamadı");
    }
  }

  async assignToParticipants(data: InsertTraining, participantIds: string[]): Promise<{ training: Training; assignments: TrainingAssignment[] }> {
    const training = await trainingRepository.create(data);
    
    const assignments: TrainingAssignment[] = [];
    for (const participantId of participantIds) {
      const assignment = await assignmentRepository.create(training.id, participantId);
      assignments.push(assignment);
    }

    return { training, assignments };
  }
}

export const trainingService = new TrainingService();
