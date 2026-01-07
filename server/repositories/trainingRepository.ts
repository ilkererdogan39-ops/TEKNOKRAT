import { db } from "../db";
import { trainings, type Training, type InsertTraining } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export class TrainingRepository {
  async findAll(): Promise<Training[]> {
    return await db.select().from(trainings).orderBy(desc(trainings.createdAt));
  }

  async findById(id: string): Promise<Training | undefined> {
    const result = await db.select().from(trainings).where(eq(trainings.id, id));
    return result[0];
  }

  async create(data: InsertTraining): Promise<Training> {
    const result = await db.insert(trainings).values({
      title: data.title,
      videoUrl: data.videoUrl,
    }).returning();
    return result[0];
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(trainings).where(eq(trainings.id, id)).returning();
    return result.length > 0;
  }

  async deleteAll(): Promise<void> {
    await db.delete(trainings);
  }
}

export const trainingRepository = new TrainingRepository();
