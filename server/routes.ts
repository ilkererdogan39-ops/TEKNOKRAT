import type { Express } from "express";
import { type Server } from "http";
import { asyncHandler, validate } from "./middleware";
import { 
  insertParticipantSchema, 
  insertTrainingSchema, 
  insertMessageSchema, 
  replyMessageSchema, 
  identifyParticipantSchema, 
  setPasswordSchema, 
  saveVideoProgressSchema, 
  changePasswordSchema, 
  resetParticipantPasswordSchema 
} from "@shared/schema";
import { z } from "zod";
import { participantService } from "./services/participantService";
import { trainingService } from "./services/trainingService";
import { assignmentService } from "./services/assignmentService";
import { messageService } from "./services/messageService";
import { videoProgressService } from "./services/videoProgressService";
import { systemService } from "./services/systemService";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ============================================
  // PARTICIPANTS
  // ============================================
  
  app.get("/api/participants", asyncHandler(async (_req, res) => {
    const participants = await participantService.getAll();
    res.json(participants);
  }));

  app.get("/api/participants/:id", asyncHandler(async (req, res) => {
    const participant = await participantService.getById(req.params.id);
    res.json(participant);
  }));

  app.post("/api/participants", 
    validate(insertParticipantSchema),
    asyncHandler(async (req, res) => {
      const participant = await participantService.create(req.body);
      res.status(201).json(participant);
    })
  );

  app.patch("/api/participants/:id", asyncHandler(async (req, res) => {
    const updateSchema = z.object({
      employeeId: z.string().min(1).optional(),
      fullName: z.string().min(1).optional(),
      department: z.string().min(1).optional(),
      email: z.string().email().optional(),
      password: z.string().optional().refine(
        (val) => val === undefined || val === "" || val.length >= 4,
        { message: "Şifre en az 4 karakter olmalı" }
      ),
    });
    
    const data = updateSchema.parse(req.body);
    
    const updateData: Partial<{ employeeId: string; fullName: string; department: string; email: string; password: string }> = {};
    if (data.employeeId !== undefined) updateData.employeeId = data.employeeId;
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.password && data.password.length >= 4) updateData.password = data.password;
    
    const participant = await participantService.update(req.params.id, updateData);
    res.json(participant);
  }));

  app.delete("/api/participants/:id", asyncHandler(async (req, res) => {
    await participantService.delete(req.params.id);
    res.status(204).send();
  }));

  app.post("/api/participants/identify", 
    validate(identifyParticipantSchema),
    asyncHandler(async (req, res) => {
      const result = await participantService.identify(req.body.employeeId, req.body.email);
      res.json(result);
    })
  );

  app.post("/api/participants/set-password", 
    validate(setPasswordSchema),
    asyncHandler(async (req, res) => {
      const participant = await participantService.setPassword(req.body.participantId, req.body.password);
      res.json(participant);
    })
  );

  app.post("/api/participants/login", asyncHandler(async (req, res) => {
    const { employeeId, email, password } = req.body;
    const participant = await participantService.login(employeeId, email, password);
    res.json(participant);
  }));

  app.post("/api/participants/change-password", 
    validate(changePasswordSchema.extend({ participantId: z.string() })),
    asyncHandler(async (req, res) => {
      const participant = await participantService.changePassword(
        req.body.participantId, 
        req.body.currentPassword, 
        req.body.newPassword
      );
      res.json(participant);
    })
  );

  app.post("/api/participants/reset-password", 
    validate(resetParticipantPasswordSchema),
    asyncHandler(async (req, res) => {
      const participant = await participantService.resetPassword(
        req.body.participantId, 
        req.body.newPassword
      );
      res.json(participant);
    })
  );

  app.post("/api/participants/import", asyncHandler(async (req, res) => {
    const { csv } = req.body;
    if (!csv || typeof csv !== "string") {
      return res.status(400).json({ error: "CSV data required" });
    }
    const imported = await participantService.importFromCSV(csv);
    res.json({ imported });
  }));

  // ============================================
  // SYSTEM / ADMIN
  // ============================================
  
  app.get("/api/system/status", asyncHandler(async (_req, res) => {
    const maintenanceMode = await systemService.getMaintenanceMode();
    res.json({ maintenanceMode });
  }));

  app.post("/api/system/maintenance", asyncHandler(async (req, res) => {
    const { enabled } = req.body;
    if (typeof enabled !== "boolean") {
      return res.status(400).json({ error: "enabled must be a boolean" });
    }
    const maintenanceMode = await systemService.setMaintenanceMode(enabled);
    res.json({ maintenanceMode });
  }));

  app.post("/api/admin/login", asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const result = await systemService.adminLogin(username, password);
    res.json(result);
  }));

  app.post("/api/admin/change-password", 
    validate(changePasswordSchema),
    asyncHandler(async (req, res) => {
      const result = await systemService.changeAdminPassword(
        req.body.currentPassword, 
        req.body.newPassword
      );
      res.json(result);
    })
  );

  // ============================================
  // TRAININGS
  // ============================================
  
  app.get("/api/trainings", asyncHandler(async (_req, res) => {
    const trainings = await trainingService.getAll();
    res.json(trainings);
  }));

  app.post("/api/trainings/assign", asyncHandler(async (req, res) => {
    const { title, videoUrl, participantIds } = req.body;
    const trainingData = insertTrainingSchema.parse({ title, videoUrl });
    const result = await trainingService.assignToParticipants(trainingData, participantIds);
    res.status(201).json(result);
  }));

  app.delete("/api/trainings/:id", asyncHandler(async (req, res) => {
    await trainingService.delete(req.params.id);
    res.status(204).send();
  }));

  // ============================================
  // ASSIGNMENTS
  // ============================================
  
  app.get("/api/assignments", asyncHandler(async (_req, res) => {
    const assignments = await assignmentService.getAll();
    res.json(assignments);
  }));

  app.get("/api/my-trainings/:participantId", asyncHandler(async (req, res) => {
    const result = await assignmentService.getByParticipantId(req.params.participantId);
    res.json(result);
  }));

  app.post("/api/assignments/:id/complete", asyncHandler(async (req, res) => {
    const assignment = await assignmentService.complete(req.params.id);
    res.json(assignment);
  }));

  // ============================================
  // MESSAGES
  // ============================================
  
  app.get("/api/messages", asyncHandler(async (_req, res) => {
    const messages = await messageService.getAll();
    res.json(messages);
  }));

  app.get("/api/messages/participant/:participantId", asyncHandler(async (req, res) => {
    const messages = await messageService.getByParticipantId(req.params.participantId);
    res.json(messages);
  }));

  app.post("/api/messages", 
    validate(insertMessageSchema),
    asyncHandler(async (req, res) => {
      const message = await messageService.create(req.body);
      res.status(201).json(message);
    })
  );

  app.patch("/api/messages/:id/read", asyncHandler(async (req, res) => {
    const message = await messageService.markAsRead(req.params.id);
    res.json(message);
  }));

  app.post("/api/messages/:id/reply", 
    validate(replyMessageSchema),
    asyncHandler(async (req, res) => {
      const message = await messageService.reply(req.params.id, req.body.reply);
      res.json(message);
    })
  );

  app.delete("/api/messages/:id", asyncHandler(async (req, res) => {
    await messageService.delete(req.params.id);
    res.status(204).send();
  }));

  // ============================================
  // VIDEO PROGRESS
  // ============================================
  
  app.get("/api/video-progress/:assignmentId", asyncHandler(async (req, res) => {
    const progress = await videoProgressService.getByAssignmentId(req.params.assignmentId);
    res.json(progress);
  }));

  app.post("/api/video-progress", 
    validate(saveVideoProgressSchema),
    asyncHandler(async (req, res) => {
      const progress = await videoProgressService.save(req.body);
      res.json(progress);
    })
  );

  app.get("/api/video-progress/:assignmentId/logs", asyncHandler(async (req, res) => {
    const logs = await videoProgressService.getLogs(req.params.assignmentId);
    res.json(logs);
  }));

  // ============================================
  // RESET
  // ============================================
  
  app.delete("/api/reset", asyncHandler(async (_req, res) => {
    await systemService.resetAll();
    res.status(204).send();
  }));

  return httpServer;
}
