import { db } from "../db";
import { videoWatchLogs, type VideoWatchLog, type SaveVideoProgress } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export class VideoProgressRepository {
  async findByAssignmentId(assignmentId: string): Promise<VideoWatchLog | undefined> {
    const result = await db.select().from(videoWatchLogs)
      .where(eq(videoWatchLogs.assignmentId, assignmentId))
      .orderBy(desc(videoWatchLogs.updatedAt))
      .limit(1);
    return result[0];
  }

  async findLogsByAssignmentId(assignmentId: string): Promise<VideoWatchLog[]> {
    return await db.select().from(videoWatchLogs)
      .where(eq(videoWatchLogs.assignmentId, assignmentId))
      .orderBy(desc(videoWatchLogs.updatedAt));
  }

  async save(data: SaveVideoProgress): Promise<VideoWatchLog> {
    const existing = await this.findByAssignmentId(data.assignmentId);
    
    if (existing) {
      const result = await db.update(videoWatchLogs)
        .set({
          watchedSeconds: data.watchedSeconds,
          progressPercent: data.progressPercent,
          totalDuration: data.totalDuration,
          updatedAt: new Date(),
        })
        .where(eq(videoWatchLogs.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(videoWatchLogs).values({
        assignmentId: data.assignmentId,
        participantId: data.participantId,
        watchedSeconds: data.watchedSeconds,
        progressPercent: data.progressPercent,
        totalDuration: data.totalDuration,
      }).returning();
      return result[0];
    }
  }

  async deleteAll(): Promise<void> {
    await db.delete(videoWatchLogs);
  }
}

export const videoProgressRepository = new VideoProgressRepository();
