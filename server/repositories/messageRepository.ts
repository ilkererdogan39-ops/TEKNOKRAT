import { db } from "../db";
import { messages, type Message, type InsertMessage } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export class MessageRepository {
  async findAll(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.createdAt));
  }

  async findById(id: string): Promise<Message | undefined> {
    const result = await db.select().from(messages).where(eq(messages.id, id));
    return result[0];
  }

  async findByParticipantId(participantId: string): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.participantId, participantId))
      .orderBy(desc(messages.createdAt));
  }

  async create(data: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values({
      participantId: data.participantId,
      subject: data.subject,
      content: data.content,
    }).returning();
    return result[0];
  }

  async markAsRead(id: string): Promise<Message | undefined> {
    const result = await db.update(messages)
      .set({ read: true })
      .where(eq(messages.id, id))
      .returning();
    return result[0];
  }

  async reply(id: string, reply: string): Promise<Message | undefined> {
    const result = await db.update(messages)
      .set({ read: true, reply, repliedAt: new Date() })
      .where(eq(messages.id, id))
      .returning();
    return result[0];
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(messages).where(eq(messages.id, id)).returning();
    return result.length > 0;
  }

  async deleteAll(): Promise<void> {
    await db.delete(messages);
  }
}

export const messageRepository = new MessageRepository();
