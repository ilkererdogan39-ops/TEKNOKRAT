import { messageRepository } from "../repositories/messageRepository";
import { type Message, type InsertMessage } from "@shared/schema";
import { NotFoundError } from "../middleware/errorHandler";

export class MessageService {
  async getAll(): Promise<Message[]> {
    return await messageRepository.findAll();
  }

  async getByParticipantId(participantId: string): Promise<Message[]> {
    return await messageRepository.findByParticipantId(participantId);
  }

  async create(data: InsertMessage): Promise<Message> {
    return await messageRepository.create(data);
  }

  async markAsRead(id: string): Promise<Message> {
    const message = await messageRepository.markAsRead(id);
    if (!message) {
      throw new NotFoundError("Mesaj bulunamadı");
    }
    return message;
  }

  async reply(id: string, reply: string): Promise<Message> {
    const message = await messageRepository.reply(id, reply);
    if (!message) {
      throw new NotFoundError("Mesaj bulunamadı");
    }
    return message;
  }

  async delete(id: string): Promise<void> {
    const deleted = await messageRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError("Mesaj bulunamadı");
    }
  }
}

export const messageService = new MessageService();
