import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertParticipantSchema, insertTrainingSchema, insertMessageSchema, replyMessageSchema, type Participant } from "@shared/schema";
import { z } from "zod";

// Helper to strip password from participant response
function sanitizeParticipant(participant: Participant): Omit<Participant, "password"> & { password?: never } {
  const { password, ...safe } = participant;
  return safe;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Participants CRUD
  app.get("/api/participants", async (_req, res) => {
    try {
      const participants = await storage.getParticipants();
      res.json(participants.map(sanitizeParticipant));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });

  app.get("/api/participants/:id", async (req, res) => {
    try {
      const participant = await storage.getParticipant(req.params.id);
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }
      res.json(sanitizeParticipant(participant));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch participant" });
    }
  });

  app.post("/api/participants", async (req, res) => {
    try {
      const data = insertParticipantSchema.parse(req.body);
      
      const existing = await storage.getParticipantByEmail(data.email);
      if (existing) {
        return res.status(400).json({ error: "Email already exists" });
      }
      
      const participant = await storage.createParticipant(data);
      res.status(201).json(sanitizeParticipant(participant));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create participant" });
    }
  });

  app.patch("/api/participants/:id", async (req, res) => {
    try {
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
      
      const participant = await storage.updateParticipant(req.params.id, updateData);
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }
      res.json(sanitizeParticipant(participant));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update participant" });
    }
  });

  app.delete("/api/participants/:id", async (req, res) => {
    try {
      await storage.deleteAssignmentsByParticipant(req.params.id);
      const deleted = await storage.deleteParticipant(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Participant not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete participant" });
    }
  });

  // Participant login
  app.post("/api/participants/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const participant = await storage.getParticipantByEmail(email);
      
      if (!participant || participant.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      res.json(sanitizeParticipant(participant));
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // CSV import
  app.post("/api/participants/import", async (req, res) => {
    try {
      const { csv } = req.body;
      if (!csv || typeof csv !== "string") {
        return res.status(400).json({ error: "CSV data required" });
      }

      const lines = csv.split(/\r?\n/).filter(line => line.trim());
      let imported = 0;
      
      // Detect delimiter (comma or semicolon - Turkish Excel uses semicolon)
      const firstLine = lines[0] || "";
      const delimiter = firstLine.includes(";") ? ";" : ",";
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ""));
        
        if (values.length >= 4) {
          // Support both 4 columns (auto-generate password) and 5 columns
          const employeeId = values[0] || "";
          const fullName = values[1] || "";
          const department = values[2] || "";
          const email = values[3] || "";
          const password = values[4] || "1234"; // Default password if not provided
          
          if (!employeeId || !fullName || !department || !email) {
            continue; // Skip invalid rows
          }
          
          try {
            const data = insertParticipantSchema.parse({
              employeeId,
              fullName,
              department,
              email,
              password
            });
            
            const existing = await storage.getParticipantByEmail(data.email);
            if (!existing) {
              await storage.createParticipant(data);
              imported++;
            }
          } catch {
            // Skip invalid rows
          }
        }
      }

      res.json({ imported });
    } catch (error) {
      res.status(500).json({ error: "CSV import failed" });
    }
  });

  // Trainings CRUD
  app.get("/api/trainings", async (_req, res) => {
    try {
      const trainings = await storage.getTrainings();
      res.json(trainings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trainings" });
    }
  });

  app.post("/api/trainings/assign", async (req, res) => {
    try {
      const { title, videoUrl, participantIds } = req.body;
      
      const trainingData = insertTrainingSchema.parse({ title, videoUrl });
      const training = await storage.createTraining(trainingData);
      
      const assignments = [];
      for (const participantId of participantIds) {
        const assignment = await storage.createAssignment(training.id, participantId);
        assignments.push(assignment);
      }

      res.status(201).json({ training, assignments });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to assign training" });
    }
  });

  app.delete("/api/trainings/:id", async (req, res) => {
    try {
      await storage.deleteAssignmentsByTraining(req.params.id);
      const deleted = await storage.deleteTraining(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Training not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete training" });
    }
  });

  // Assignments
  app.get("/api/assignments", async (_req, res) => {
    try {
      const assignments = await storage.getAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  app.get("/api/my-trainings/:participantId", async (req, res) => {
    try {
      const assignments = await storage.getAssignmentsByParticipant(req.params.participantId);
      const trainings = await storage.getTrainings();
      
      const result = assignments.map(assignment => ({
        assignment,
        training: trainings.find(t => t.id === assignment.trainingId)!
      })).filter(item => item.training);

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trainings" });
    }
  });

  app.post("/api/assignments/:id/complete", async (req, res) => {
    try {
      const assignment = await storage.completeAssignment(req.params.id);
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete assignment" });
    }
  });

  // Messages
  app.get("/api/messages", async (_req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/participant/:participantId", async (req, res) => {
    try {
      const messages = await storage.getMessagesByParticipant(req.params.participantId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const data = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(data);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.patch("/api/messages/:id/read", async (req, res) => {
    try {
      const message = await storage.markMessageAsRead(req.params.id);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  app.post("/api/messages/:id/reply", async (req, res) => {
    try {
      const { reply } = replyMessageSchema.parse(req.body);
      const message = await storage.replyToMessage(req.params.id, reply);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to reply to message" });
    }
  });

  // Reset all data
  app.delete("/api/reset", async (_req, res) => {
    try {
      await storage.resetAll();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to reset data" });
    }
  });

  return httpServer;
}
