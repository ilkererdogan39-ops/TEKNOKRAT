import { randomUUID } from "crypto";
import { db } from "../db";
import { participants, type Participant, type InsertParticipant } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
export class ParticipantRepository {
  async findAll(): Promise<Participant[]> {
    return await db.select().from(participants);
  }

  async findById(id: string): Promise<Participant | undefined> {
    const result = await db.select().from(participants).where(eq(participants.id, id));
    return result[0];
  }

  async findByEmail(email: string): Promise<Participant | undefined> {
    const result = await db.select().from(participants).where(
      sql`lower(${participants.email}) = lower(${email})`
    );
    return result[0];
  }

  async findByEmployeeIdAndEmail(employeeId: string, email: string): Promise<Participant | undefined> {
    const result = await db.select().from(participants).where(
      and(
        eq(participants.employeeId, employeeId),
        sql`lower(${participants.email}) = lower(${email})`
      )
    );
    return result[0];
  }

async create(data: InsertParticipant): Promise<Participant> {
  const result = await db.insert(participants).values({
    id: randomUUID(),
    employeeId: data.employeeId,
    fullName: data.fullName,
    department: data.department,
    email: data.email,
    password: data.password || null,
    hasPassword: !!data.password,
  }).returning();
  return result[0];
}
  async update(id: string, data: Partial<InsertParticipant>): Promise<Participant | undefined> {
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

  async setPassword(id: string, password: string): Promise<Participant | undefined> {
    const result = await db.update(participants)
      .set({ password, hasPassword: true })
      .where(eq(participants.id, id))
      .returning();
    return result[0];
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(participants).where(eq(participants.id, id)).returning();
    return result.length > 0;
  }

  async deleteAll(): Promise<void> {
    await db.delete(participants);
  }
}

export const participantRepository = new ParticipantRepository();
