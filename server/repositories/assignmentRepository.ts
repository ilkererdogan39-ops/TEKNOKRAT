import { db } from "../db";
import { trainingAssignments, type TrainingAssignment } from "@shared/schema";
import { eq } from "drizzle-orm";

export class AssignmentRepository {
  async findAll(): Promise<TrainingAssignment[]> {
    return await db.select().from(trainingAssignments);
  }

  async findById(id: string): Promise<TrainingAssignment | undefined> {
    const result = await db.select().from(trainingAssignments).where(eq(trainingAssignments.id, id));
    return result[0];
  }

  async findByParticipantId(participantId: string): Promise<TrainingAssignment[]> {
    return await db.select().from(trainingAssignments).where(eq(trainingAssignments.participantId, participantId));
  }

  async create(trainingId: string, participantId: string): Promise<TrainingAssignment> {
    const result = await db.insert(trainingAssignments).values({
      trainingId,
      participantId,
    }).returning();
    return result[0];
  }

  async complete(id: string): Promise<TrainingAssignment | undefined> {
    const result = await db.update(trainingAssignments)
      .set({ 
        completed: true, 
        completedAt: new Date(), 
        progress: 100 
      })
      .where(eq(trainingAssignments.id, id))
      .returning();
    return result[0];
  }

  async updateProgress(id: string, progress: number): Promise<void> {
    await db.update(trainingAssignments)
      .set({ progress: Math.round(progress) })
      .where(eq(trainingAssignments.id, id));
  }

  async deleteByTrainingId(trainingId: string): Promise<void> {
    await db.delete(trainingAssignments).where(eq(trainingAssignments.trainingId, trainingId));
  }

  async deleteByParticipantId(participantId: string): Promise<void> {
    await db.delete(trainingAssignments).where(eq(trainingAssignments.participantId, participantId));
  }

  async deleteAll(): Promise<void> {
    await db.delete(trainingAssignments);
  }
}

export const assignmentRepository = new AssignmentRepository();
