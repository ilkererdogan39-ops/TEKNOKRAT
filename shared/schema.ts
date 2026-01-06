import { pgTable, text, boolean, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export type UserRole = "admin" | "participant";

export const participants = pgTable("participants", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id", { length: 100 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  department: varchar("department", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  password: text("password"),
  hasPassword: boolean("has_password").notNull().default(false),
});

export const trainings = pgTable("trainings", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 500 }).notNull(),
  videoUrl: text("video_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const trainingAssignments = pgTable("training_assignments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  trainingId: varchar("training_id", { length: 36 }).notNull(),
  participantId: varchar("participant_id", { length: 36 }).notNull(),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  progress: integer("progress").notNull().default(0),
});

export const messages = pgTable("messages", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id", { length: 36 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  read: boolean("read").notNull().default(false),
  reply: text("reply"),
  repliedAt: timestamp("replied_at"),
});

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: text("password").notNull(),
});

export const videoWatchLogs = pgTable("video_watch_logs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id", { length: 36 }).notNull(),
  participantId: varchar("participant_id", { length: 36 }).notNull(),
  watchedSeconds: integer("watched_seconds").notNull().default(0),
  progressPercent: integer("progress_percent").notNull().default(0),
  totalDuration: integer("total_duration"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Participant = typeof participants.$inferSelect;
export type InsertParticipantDB = typeof participants.$inferInsert;
export type Training = typeof trainings.$inferSelect;
export type InsertTrainingDB = typeof trainings.$inferInsert;
export type TrainingAssignment = typeof trainingAssignments.$inferSelect;
export type InsertAssignmentDB = typeof trainingAssignments.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessageDB = typeof messages.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUserDB = typeof users.$inferInsert;
export type VideoWatchLog = typeof videoWatchLogs.$inferSelect;
export type InsertVideoWatchLogDB = typeof videoWatchLogs.$inferInsert;

export type SafeParticipant = Omit<Participant, "password">;

export const insertParticipantSchema = createInsertSchema(participants).omit({ id: true }).extend({
  employeeId: z.string().min(1, "Sicil no gerekli"),
  fullName: z.string().min(1, "Ad soyad gerekli"),
  department: z.string().min(1, "Departman gerekli"),
  email: z.string().email("Geçerli e-posta gerekli"),
  password: z.string().min(4, "Şifre en az 4 karakter olmalı").optional().nullable(),
});

export type InsertParticipant = z.infer<typeof insertParticipantSchema>;

export const identifyParticipantSchema = z.object({
  employeeId: z.string().min(1, "Sicil no gerekli"),
  email: z.string().email("Geçerli e-posta gerekli"),
});

export type IdentifyParticipant = z.infer<typeof identifyParticipantSchema>;

export const setPasswordSchema = z.object({
  participantId: z.string().min(1),
  password: z.string().min(4, "Şifre en az 4 karakter olmalı"),
});

export type SetPassword = z.infer<typeof setPasswordSchema>;

export const insertTrainingSchema = createInsertSchema(trainings).omit({ id: true, createdAt: true }).extend({
  title: z.string().min(1, "Eğitim başlığı gerekli"),
  videoUrl: z.string().url("Geçerli video URL gerekli"),
});

export type InsertTraining = z.infer<typeof insertTrainingSchema>;

export const insertAssignmentSchema = z.object({
  trainingId: z.string().min(1),
  participantIds: z.array(z.string()).min(1, "En az bir katılımcı seçin"),
});

export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

export const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "egitim12345",
};

export interface AuthSession {
  role: UserRole;
  participantId?: string;
}

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

export const insertMessageSchema = createInsertSchema(messages).omit({ 
  id: true, 
  createdAt: true, 
  read: true, 
  reply: true, 
  repliedAt: true 
}).extend({
  participantId: z.string().min(1),
  subject: z.string().min(1, "Konu gerekli"),
  content: z.string().min(1, "Mesaj içeriği gerekli"),
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;

export const replyMessageSchema = z.object({
  reply: z.string().min(1, "Yanıt gerekli"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mevcut şifre gerekli"),
  newPassword: z.string().min(4, "Yeni şifre en az 4 karakter olmalı"),
});

export type ChangePassword = z.infer<typeof changePasswordSchema>;

export const resetParticipantPasswordSchema = z.object({
  participantId: z.string().min(1),
  newPassword: z.string().min(4, "Yeni şifre en az 4 karakter olmalı"),
});

export type ResetParticipantPassword = z.infer<typeof resetParticipantPasswordSchema>;

export type ReplyMessage = z.infer<typeof replyMessageSchema>;

export const insertUserSchema = createInsertSchema(users).omit({ id: true });

export type InsertUser = z.infer<typeof insertUserSchema>;

export const saveVideoProgressSchema = z.object({
  assignmentId: z.string().min(1),
  participantId: z.string().min(1),
  watchedSeconds: z.number().min(0),
  progressPercent: z.number().min(0).max(100),
  totalDuration: z.number().optional().nullable(),
});

export type SaveVideoProgress = z.infer<typeof saveVideoProgressSchema>;
