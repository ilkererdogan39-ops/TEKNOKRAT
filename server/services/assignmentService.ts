import { assignmentRepository } from "../repositories/assignmentRepository";
import { trainingRepository } from "../repositories/trainingRepository";
import { type TrainingAssignment, type Training } from "@shared/schema";
import { NotFoundError } from "../middleware/errorHandler";

export interface ParticipantTraining {
  assignment: TrainingAssignment;
  training: Training;
}

export class AssignmentService {
  async getAll(): Promise<TrainingAssignment[]> {
    return await assignmentRepository.findAll();
  }

  async getById(id: string): Promise<TrainingAssignment> {
    const assignment = await assignmentRepository.findById(id);
    if (!assignment) {
      throw new NotFoundError("Atama bulunamadı");
    }
    return assignment;
  }

  async getByParticipantId(participantId: string): Promise<ParticipantTraining[]> {
    const assignments = await assignmentRepository.findByParticipantId(participantId);
    const trainings = await trainingRepository.findAll();
    
    return assignments
      .map(assignment => ({
        assignment,
        training: trainings.find(t => t.id === assignment.trainingId)!
      }))
      .filter(item => item.training);
  }

  async complete(id: string): Promise<TrainingAssignment> {
    const assignment = await assignmentRepository.complete(id);
    if (!assignment) {
      throw new NotFoundError("Atama bulunamadı");
    }
    return assignment;
  }

  async updateProgress(id: string, progress: number): Promise<void> {
    await assignmentRepository.updateProgress(id, progress);
  }
}

export const assignmentService = new AssignmentService();
