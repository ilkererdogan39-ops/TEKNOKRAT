import { participantRepository } from "../repositories/participantRepository";
import { assignmentRepository } from "../repositories/assignmentRepository";
import { type Participant, type InsertParticipant, insertParticipantSchema } from "@shared/schema";
import { NotFoundError, ConflictError, UnauthorizedError } from "../middleware/errorHandler";

export function sanitizeParticipant(participant: Participant): Omit<Participant, "password"> & { password?: never } {
  const { password, ...safe } = participant;
  return safe;
}

export class ParticipantService {
  async getAll(): Promise<(Omit<Participant, "password"> & { password?: never })[]> {
    const participants = await participantRepository.findAll();
    return participants.map(sanitizeParticipant);
  }

  async getById(id: string): Promise<Omit<Participant, "password"> & { password?: never }> {
    const participant = await participantRepository.findById(id);
    if (!participant) {
      throw new NotFoundError("Katılımcı bulunamadı");
    }
    return sanitizeParticipant(participant);
  }

  async create(data: InsertParticipant): Promise<Omit<Participant, "password"> & { password?: never }> {
    const existing = await participantRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError("Bu e-posta adresi zaten kayıtlı");
    }
    const participant = await participantRepository.create(data);
    return sanitizeParticipant(participant);
  }

  async update(id: string, data: Partial<InsertParticipant>): Promise<Omit<Participant, "password"> & { password?: never }> {
    const participant = await participantRepository.update(id, data);
    if (!participant) {
      throw new NotFoundError("Katılımcı bulunamadı");
    }
    return sanitizeParticipant(participant);
  }

  async delete(id: string): Promise<void> {
    await assignmentRepository.deleteByParticipantId(id);
    const deleted = await participantRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError("Katılımcı bulunamadı");
    }
  }

  async identify(employeeId: string, email: string): Promise<{ participantId: string; hasPassword: boolean; fullName: string }> {
    const participant = await participantRepository.findByEmployeeIdAndEmail(employeeId, email);
    if (!participant) {
      throw new NotFoundError("Katılımcı bulunamadı");
    }
    return {
      participantId: participant.id,
      hasPassword: participant.hasPassword,
      fullName: participant.fullName,
    };
  }

  async setPassword(participantId: string, password: string): Promise<Omit<Participant, "password"> & { password?: never }> {
    const participant = await participantRepository.findById(participantId);
    if (!participant) {
      throw new NotFoundError("Katılımcı bulunamadı");
    }
    if (participant.hasPassword) {
      throw new ConflictError("Şifre zaten belirlenmiş");
    }
    const updated = await participantRepository.setPassword(participantId, password);
    if (!updated) {
      throw new Error("Şifre kaydedilemedi");
    }
    return sanitizeParticipant(updated);
  }

  async login(employeeId: string, email: string, password: string): Promise<Omit<Participant, "password"> & { password?: never }> {
    const participant = await participantRepository.findByEmployeeIdAndEmail(employeeId, email);
    if (!participant) {
      throw new NotFoundError("Katılımcı bulunamadı");
    }
    if (!participant.hasPassword || participant.password !== password) {
      throw new UnauthorizedError("Geçersiz şifre");
    }
    return sanitizeParticipant(participant);
  }

  async changePassword(participantId: string, currentPassword: string, newPassword: string): Promise<Omit<Participant, "password"> & { password?: never }> {
    const participant = await participantRepository.findById(participantId);
    if (!participant || participant.password !== currentPassword) {
      throw new UnauthorizedError("Mevcut şifre yanlış");
    }
    const updated = await participantRepository.setPassword(participantId, newPassword);
    if (!updated) {
      throw new Error("Şifre değiştirilemedi");
    }
    return sanitizeParticipant(updated);
  }

  async resetPassword(participantId: string, newPassword: string): Promise<Omit<Participant, "password"> & { password?: never }> {
    const updated = await participantRepository.setPassword(participantId, newPassword);
    if (!updated) {
      throw new NotFoundError("Katılımcı bulunamadı");
    }
    return sanitizeParticipant(updated);
  }

  async importFromCSV(csv: string): Promise<number> {
    const lines = csv.split(/\r?\n/).filter(line => line.trim());
    let imported = 0;
    
    const firstLine = lines[0] || "";
    const delimiter = firstLine.includes(";") ? ";" : ",";
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ""));
      
      if (values.length >= 4) {
        const employeeId = values[0] || "";
        const fullName = values[1] || "";
        const department = values[2] || "";
        const email = values[3] || "";
        
        if (!employeeId || !fullName || !department || !email) {
          continue;
        }
        
        try {
          const data = insertParticipantSchema.parse({
            employeeId,
            fullName,
            department,
            email,
          });
          
          const existing = await participantRepository.findByEmail(data.email);
          if (!existing) {
            await participantRepository.create(data);
            imported++;
          }
        } catch {
          continue;
        }
      }
    }

    return imported;
  }
}

export const participantService = new ParticipantService();
