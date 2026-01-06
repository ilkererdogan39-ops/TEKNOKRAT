import { 
  type Participant, 
  type InsertParticipant,
  type Training,
  type InsertTraining,
  type TrainingAssignment,
  type Message,
  type InsertMessage,
  type User,
  type InsertUser
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Participants
  getParticipants(): Promise<Participant[]>;
  getParticipant(id: string): Promise<Participant | undefined>;
  getParticipantByEmail(email: string): Promise<Participant | undefined>;
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  updateParticipant(id: string, data: Partial<InsertParticipant>): Promise<Participant | undefined>;
  deleteParticipant(id: string): Promise<boolean>;
  
  // Trainings
  getTrainings(): Promise<Training[]>;
  getTraining(id: string): Promise<Training | undefined>;
  createTraining(training: InsertTraining): Promise<Training>;
  deleteTraining(id: string): Promise<boolean>;
  
  // Assignments
  getAssignments(): Promise<TrainingAssignment[]>;
  getAssignment(id: string): Promise<TrainingAssignment | undefined>;
  getAssignmentsByParticipant(participantId: string): Promise<TrainingAssignment[]>;
  createAssignment(trainingId: string, participantId: string): Promise<TrainingAssignment>;
  completeAssignment(id: string): Promise<TrainingAssignment | undefined>;
  deleteAssignmentsByTraining(trainingId: string): Promise<void>;
  deleteAssignmentsByParticipant(participantId: string): Promise<void>;
  
  // Messages
  getMessages(): Promise<Message[]>;
  getMessage(id: string): Promise<Message | undefined>;
  getMessagesByParticipant(participantId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<Message | undefined>;
  replyToMessage(id: string, reply: string): Promise<Message | undefined>;
  
  // Reset
  resetAll(): Promise<void>;
  
  // Legacy User support
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private participants: Map<string, Participant>;
  private trainings: Map<string, Training>;
  private assignments: Map<string, TrainingAssignment>;
  private messages: Map<string, Message>;
  private users: Map<string, User>;

  constructor() {
    this.participants = new Map();
    this.trainings = new Map();
    this.assignments = new Map();
    this.messages = new Map();
    this.users = new Map();
  }

  // Participants
  async getParticipants(): Promise<Participant[]> {
    return Array.from(this.participants.values());
  }

  async getParticipant(id: string): Promise<Participant | undefined> {
    return this.participants.get(id);
  }

  async getParticipantByEmail(email: string): Promise<Participant | undefined> {
    return Array.from(this.participants.values()).find(p => p.email === email);
  }

  async createParticipant(data: InsertParticipant): Promise<Participant> {
    const id = randomUUID();
    const participant: Participant = { ...data, id };
    this.participants.set(id, participant);
    return participant;
  }

  async updateParticipant(id: string, data: Partial<InsertParticipant>): Promise<Participant | undefined> {
    const existing = this.participants.get(id);
    if (!existing) return undefined;
    
    const updated: Participant = { ...existing, ...data };
    this.participants.set(id, updated);
    return updated;
  }

  async deleteParticipant(id: string): Promise<boolean> {
    return this.participants.delete(id);
  }

  // Trainings
  async getTrainings(): Promise<Training[]> {
    return Array.from(this.trainings.values());
  }

  async getTraining(id: string): Promise<Training | undefined> {
    return this.trainings.get(id);
  }

  async createTraining(data: InsertTraining): Promise<Training> {
    const id = randomUUID();
    const training: Training = { 
      ...data, 
      id,
      createdAt: new Date().toISOString()
    };
    this.trainings.set(id, training);
    return training;
  }

  async deleteTraining(id: string): Promise<boolean> {
    return this.trainings.delete(id);
  }

  // Assignments
  async getAssignments(): Promise<TrainingAssignment[]> {
    return Array.from(this.assignments.values());
  }

  async getAssignment(id: string): Promise<TrainingAssignment | undefined> {
    return this.assignments.get(id);
  }

  async getAssignmentsByParticipant(participantId: string): Promise<TrainingAssignment[]> {
    return Array.from(this.assignments.values()).filter(a => a.participantId === participantId);
  }

  async createAssignment(trainingId: string, participantId: string): Promise<TrainingAssignment> {
    const id = randomUUID();
    const assignment: TrainingAssignment = {
      id,
      trainingId,
      participantId,
      assignedAt: new Date().toISOString(),
      completed: false,
      completedAt: null,
      progress: 0
    };
    this.assignments.set(id, assignment);
    return assignment;
  }

  async completeAssignment(id: string): Promise<TrainingAssignment | undefined> {
    const existing = this.assignments.get(id);
    if (!existing) return undefined;
    
    const updated: TrainingAssignment = {
      ...existing,
      completed: true,
      completedAt: new Date().toISOString(),
      progress: 100
    };
    this.assignments.set(id, updated);
    return updated;
  }

  async deleteAssignmentsByTraining(trainingId: string): Promise<void> {
    const entries = Array.from(this.assignments.entries());
    for (const [id, assignment] of entries) {
      if (assignment.trainingId === trainingId) {
        this.assignments.delete(id);
      }
    }
  }

  async deleteAssignmentsByParticipant(participantId: string): Promise<void> {
    const entries = Array.from(this.assignments.entries());
    for (const [id, assignment] of entries) {
      if (assignment.participantId === participantId) {
        this.assignments.delete(id);
      }
    }
  }

  // Messages
  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByParticipant(participantId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(m => m.participantId === participantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      read: false,
      reply: null,
      repliedAt: null
    };
    this.messages.set(id, message);
    return message;
  }

  async markMessageAsRead(id: string): Promise<Message | undefined> {
    const existing = this.messages.get(id);
    if (!existing) return undefined;
    
    const updated: Message = { ...existing, read: true };
    this.messages.set(id, updated);
    return updated;
  }

  async replyToMessage(id: string, reply: string): Promise<Message | undefined> {
    const existing = this.messages.get(id);
    if (!existing) return undefined;
    
    const updated: Message = {
      ...existing,
      read: true,
      reply,
      repliedAt: new Date().toISOString()
    };
    this.messages.set(id, updated);
    return updated;
  }

  // Reset
  async resetAll(): Promise<void> {
    this.participants.clear();
    this.trainings.clear();
    this.assignments.clear();
    this.messages.clear();
  }

  // Legacy User support
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(data: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...data, id };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
