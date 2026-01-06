import { z } from "zod";

// User roles
export type UserRole = "admin" | "participant";

// Participant (trainee) schema
export interface Participant {
  id: string;
  employeeId: string;
  fullName: string;
  department: string;
  email: string;
  password: string | null;
  hasPassword: boolean;
}

// Safe participant without password (for API responses)
export type SafeParticipant = Omit<Participant, "password">;

export const insertParticipantSchema = z.object({
  employeeId: z.string().min(1, "Sicil no gerekli"),
  fullName: z.string().min(1, "Ad soyad gerekli"),
  department: z.string().min(1, "Departman gerekli"),
  email: z.string().email("Geçerli e-posta gerekli"),
  password: z.string().min(4, "Şifre en az 4 karakter olmalı").optional(),
});

export type InsertParticipant = z.infer<typeof insertParticipantSchema>;

// Schema for identifying participant
export const identifyParticipantSchema = z.object({
  employeeId: z.string().min(1, "Sicil no gerekli"),
  email: z.string().email("Geçerli e-posta gerekli"),
});

export type IdentifyParticipant = z.infer<typeof identifyParticipantSchema>;

// Schema for setting password
export const setPasswordSchema = z.object({
  participantId: z.string().min(1),
  password: z.string().min(4, "Şifre en az 4 karakter olmalı"),
});

export type SetPassword = z.infer<typeof setPasswordSchema>;

// Training schema
export interface Training {
  id: string;
  title: string;
  videoUrl: string;
  createdAt: string;
}

export const insertTrainingSchema = z.object({
  title: z.string().min(1, "Eğitim başlığı gerekli"),
  videoUrl: z.string().url("Geçerli video URL gerekli"),
});

export type InsertTraining = z.infer<typeof insertTrainingSchema>;

// Training Assignment schema
export interface TrainingAssignment {
  id: string;
  trainingId: string;
  participantId: string;
  assignedAt: string;
  completed: boolean;
  completedAt: string | null;
  progress: number; // 0-100
}

export const insertAssignmentSchema = z.object({
  trainingId: z.string().min(1),
  participantIds: z.array(z.string()).min(1, "En az bir katılımcı seçin"),
});

export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

// Admin credentials (hardcoded for simplicity)
export const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123",
};

// Auth session
export interface AuthSession {
  role: UserRole;
  participantId?: string;
}

// Report data
export interface ParticipantReport {
  participant: Participant;
  totalAssigned: number;
  totalCompleted: number;
  completionRate: number;
  trainings: {
    training: Training;
    assignment: TrainingAssignment;
  }[];
}

// Message schema for feedback system
export interface Message {
  id: string;
  participantId: string;
  subject: string;
  content: string;
  createdAt: string;
  read: boolean;
  reply: string | null;
  repliedAt: string | null;
}

export const insertMessageSchema = z.object({
  participantId: z.string().min(1),
  subject: z.string().min(1, "Konu gerekli"),
  content: z.string().min(1, "Mesaj içeriği gerekli"),
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;

export const replyMessageSchema = z.object({
  reply: z.string().min(1, "Yanıt gerekli"),
});

export type ReplyMessage = z.infer<typeof replyMessageSchema>;

// Legacy User type for compatibility
export interface User {
  id: string;
  username: string;
  password: string;
}

export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
