import crypto from "crypto";
import {
  type Participant,
  type InsertParticipant,
  type Training,
  type InsertTraining,
  type TrainingAssignment,
  type Message,
  type InsertMessage,
  type User,
  type InsertUser,
  type VideoWatchLog,
  type SaveVideoProgress,
  participants,
  trainings,
  trainingAssignments,
  messages,
  users,
  videoWatchLogs,
  systemSettings
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  getParticipants(): Promise<Participant[]>;
  getParticipant(id: string): Promise<Participant | undefined>;
  getParticipantByEmail(email: string): Promise<Participant | undefined>;
  getParticipantByEmployeeIdAndEmail(employeeId: string, email: string): Promise<Participant | undefined>;
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  updateParticipant(id: string, data: Partial<InsertParticipant>): Promise<Participant | undefined>;
  setParticipantPassword(id: string, password: string): Promise<Participant | undefined>;
  changeParticipantPassword(id: string, currentPassword: string, newPassword: string): Promise<Participant | undefined>;
  deleteParticipant(id: string): Promise<boolean>;

  getTrainings(): Promise<Training[]>;
  getTraining(id: string): Promise<Training | undefined>;
  createTraining(training: InsertTraining): Promise<Training>;
  deleteTraining(id: string): Promise<boolean>;

  getAssignments(): Promise<TrainingAssignment[]>;
  getAssignment(id: string): Promise<TrainingAssignment | undefined>;
  getAssignmentsByParticipant(participantId: string): Promise<TrainingAssignment[]>;
  createAssignment(trainingId: string, participantId: string): Promise<TrainingAssignment>;
  completeAssignment(id: string): Promise<TrainingAssignment | undefined>;
  deleteAssignmentsByTraining(trainingId: string): Promise<void>;
  deleteAssignmentsByParticipant(participantId: string): Promise<void>;

  getMessages(): Promise<Message[]>;
  getMessage(id: string): Promise<Message | undefined>;
  getMessagesByParticipant(participantId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<Message | undefined>;
  replyToMessage(id: string, reply: string): Promise<Message | undefined>;
  deleteMessage(id: string): Promise<boolean>;

  resetAll(): Promise<void>;

  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getVideoProgress(assignmentId: string): Promise<VideoWatchLog | undefined>;
  saveVideoProgress(data: SaveVideoProgress): Promise<VideoWatchLog>;
  getVideoWatchLogs(assignmentId: string): Promise<VideoWatchLog[]>;
  updateAssignmentProgress(assignmentId: string, progress: number): Promise<void>;

  getSystemSetting(key: string): Promise<string | undefined>;
  setSystemSetting(key: string, value: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getParticipants(): Promise<Participant[]> {
    return await db.select().from(participants);
  }

  async getParticipant(id: string): Promise<Participant | undefined> {
    const result = await db.select().from(participants).where(eq(participants.id, id));
    return result[0];
  }

  async getParticipantByEmail(email: string): Promise<Participant | undefined> {
    const result = await db.select().from(participants).where(
      sql`lower(${participants.email}) = lower(${email})`
    );
    return result[0];
  }

  async getParticipantByEmployeeIdAndEmail(employeeId: string, email: string): Promise<Participant | undefined> {
    const result = await db.select().from(participants).where(
      and(
        eq(participants.employeeId, employeeId),
        sql`lower(${participants.email}) = lower(${email})`
      )
    );
    return result[0];
  }

  async createParticipant(data: InsertParticipant): Promise<Participant> {
    const result = await db.insert(participants).values({
      id: crypto.randomUUID(),
      employeeId: data.employeeId,
      fullName: data.fullName,
      department: data.department,
      email: data.email,
      password: data.password || null,
      hasPassword: !!data.password,
    }).returning();
    return result[0];
  }

  async updateParticipant(id: string, data: Partial<InsertParticipant>): Promise<Participant | undefined> {
    const updateData: Partial<typeof participants.$inferInsert> = {};
    if (data.employeeId !== undefined) updateData.employeeId = data.employeeId;
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.password !== undefined) {
      updateData.password = data.password;
      updateData.hasPassword = true;
    }

    const result = await db.update(participants)
      .set(updateData)
      .where(eq(participants.id, id))
      .returning();
    return result[0];
  }

  async setParticipantPassword(id: string, password: string): Promise<Participant | undefined> {
    const result = await db.update(participants)
      .set({ password, hasPassword: true })
      .where(eq(participants.id, id))
      .returning();
    return result[0];
  }

  async changeParticipantPassword(id: string, currentPassword: string, newPassword: string): Promise<Participant | undefined> {
    const participant = await this.getParticipant(id);
    if (!participant || participant.password !== currentPassword) {
      return undefined;
    }
    const result = await db.update(participants)
      .set({ password: newPassword })
      .where(eq(participants.id, id))
      .returning();
    return result[0];
  }

  async deleteParticipant(id: string): Promise<boolean> {
    const result = await db.delete(participants).where(eq(participants.id, id)).returning();
    return result.length > 0;
  }

  async getTrainings(): Promise<Training[]> {
    return await db.select().from(trainings).orderBy(desc(trainings.createdAt));
  }

  async getTraining(id: string): Promise<Training | undefined> {
    const result = await db.select().from(trainings).where(eq(trainings.id, id));
    return result[0];
  }

  async createTraining(data: InsertTraining): Promise<Training> {
    const result = await db.insert(trainings).values({
      id: crypto.randomUUID(),
      title: data.title,
      videoUrl: data.videoUrl,
    }).returning();
    return result[0];
  }

  async deleteTraining(id: string): Promise<boolean> {
    const result = await db.delete(trainings).where(eq(trainings.id, id)).returning();
    return result.length > 0;
  }

  async getAssignments(): Promise<TrainingAssignment[]> {
    return await db.select().from(trainingAssignments);
  }

  async getAssignment(id: string): Promise<TrainingAssignment | undefined> {
    const result = await db.select().from(trainingAssignments).where(eq(trainingAssignments.id, id));
    return result[0];
  }

  async getAssignmentsByParticipant(participantId: string): Promise<TrainingAssignment[]> {
    return await db.select().from(trainingAssignments).where(eq(trainingAssignments.participantId, participantId));
  }

  async createAssignment(trainingId: string, participantId: string): Promise<TrainingAssignment> {
    const result = await db.insert(trainingAssignments).values({
      id: crypto.randomUUID(),
      trainingId,
      participantId,
    }).returning();
    return result[0];
  }

  async completeAssignment(id: string): Promise<TrainingAssignment | undefined> {
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

  async deleteAssignmentsByTraining(trainingId: string): Promise<void> {
    await db.delete(trainingAssignments).where(eq(trainingAssignments.trainingId, trainingId));
  }

  async deleteAssignmentsByParticipant(participantId: string): Promise<void> {
    await db.delete(trainingAssignments).where(eq(trainingAssignments.participantId, participantId));
  }

  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.createdAt));
  }

  async getMessage(id: string): Promise<Message | undefined> {
    const result = await db.select().from(messages).where(eq(messages.id, id));
    return result[0];
  }

  async getMessagesByParticipant(participantId: string): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.participantId, participantId))
      .orderBy(desc(messages.createdAt));
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values({
      id: crypto.randomUUID(),
      participantId: data.participantId,
      subject: data.subject,
      content: data.content,
    }).returning();
    return result[0];
  }

  async markMessageAsRead(id: string): Promise<Message | undefined> {
    const result = await db.update(messages)
      .set({ read: true })
      .where(eq(messages.id, id))
      .returning();
    return result[0];
  }

  async replyToMessage(id: string, reply: string): Promise<Message | undefined> {
    const result = await db.update(messages)
      .set({ read: true, reply, repliedAt: new Date() })
      .where(eq(messages.id, id))
      .returning();
    return result[0];
  }

  async deleteMessage(id: string): Promise<boolean> {
    const result = await db.delete(messages).where(eq(messages.id, id)).returning();
    return result.length > 0;
  }

  async resetAll(): Promise<void> {
    await db.delete(videoWatchLogs);
    await db.delete(trainingAssignments);
    await db.delete(messages);
    await db.delete(trainings);
    await db.delete(participants);
    await db.delete(users);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(data: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      id: crypto.randomUUID(),
      ...data,
    }).returning();
    return result[0];
  }

  async getVideoProgress(assignmentId: string): Promise<VideoWatchLog | undefined> {
    const result = await db.select().from(videoWatchLogs)
      .where(eq(videoWatchLogs.assignmentId, assignmentId))
      .orderBy(desc(videoWatchLogs.updatedAt))
      .limit(1);
    return result[0];
  }

  async saveVideoProgress(data: SaveVideoProgress): Promise<VideoWatchLog> {
    const existing = await this.getVideoProgress(data.assignmentId);

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
        id: crypto.randomUUID(),
        assignmentId: data.assignmentId,
        participantId: data.participantId,
        watchedSeconds: data.watchedSeconds,
        progressPercent: data.progressPercent,
        totalDuration: data.totalDuration,
      }).returning();
      return result[0];
    }
  }

  async getVideoWatchLogs(assignmentId: string): Promise<VideoWatchLog[]> {
    return await db.select().from(videoWatchLogs)
      .where(eq(videoWatchLogs.assignmentId, assignmentId))
      .orderBy(desc(videoWatchLogs.updatedAt));
  }

  async updateAssignmentProgress(assignmentId: string, progress: number): Promise<void> {
    await db.update(trainingAssignments)
      .set({ progress: Math.round(progress) })
      .where(eq(trainingAssignments.id, assignmentId));
  }

  async getSystemSetting(key: string): Promise<string | undefined> {
    const result = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return result[0]?.value;
  }

  async setSystemSetting(key: string, value: string): Promise<void> {
    const existing = await this.getSystemSetting(key);
    if (existing !== undefined) {
      await db.update(systemSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(systemSettings.key, key));
    } else {
      await db.insert(systemSettings).values({ id: crypto.randomUUID(), key, value });
    }
  }
}

export const storage = new DatabaseStorage();
