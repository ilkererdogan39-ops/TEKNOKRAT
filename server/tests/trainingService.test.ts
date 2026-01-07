import { describe, it, expect, beforeEach, vi } from "vitest";
import { TrainingService } from "../services/trainingService";
import { trainingRepository } from "../repositories/trainingRepository";
import { assignmentRepository } from "../repositories/assignmentRepository";
import { NotFoundError } from "../middleware/errorHandler";
import type { Training, TrainingAssignment } from "../../shared/schema";

vi.mock("../repositories/trainingRepository");
vi.mock("../repositories/assignmentRepository");

const mockTraining: Training = {
  id: "1",
  title: "Test Training",
  videoUrl: "https://youtube.com/watch?v=test123",
  createdAt: new Date(),
};

const mockAssignment: TrainingAssignment = {
  id: "a1",
  participantId: "p1",
  trainingId: "1",
  completed: false,
  completedAt: null,
  assignedAt: new Date(),
  progress: 0,
};

describe("TrainingService", () => {
  let service: TrainingService;

  beforeEach(() => {
    service = new TrainingService();
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("should return all trainings", async () => {
      vi.mocked(trainingRepository.findAll).mockResolvedValue([mockTraining]);
      
      const result = await service.getAll();
      
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Test Training");
      expect(trainingRepository.findAll).toHaveBeenCalled();
    });

    it("should return empty array when no trainings exist", async () => {
      vi.mocked(trainingRepository.findAll).mockResolvedValue([]);
      
      const result = await service.getAll();
      
      expect(result).toHaveLength(0);
    });
  });

  describe("getById", () => {
    it("should return training by id", async () => {
      vi.mocked(trainingRepository.findById).mockResolvedValue(mockTraining);
      
      const result = await service.getById("1");
      
      expect(result.title).toBe("Test Training");
      expect(trainingRepository.findById).toHaveBeenCalledWith("1");
    });

    it("should throw NotFoundError when training not found", async () => {
      vi.mocked(trainingRepository.findById).mockResolvedValue(undefined);
      
      await expect(service.getById("999")).rejects.toThrow(NotFoundError);
    });
  });

  describe("create", () => {
    it("should create training", async () => {
      vi.mocked(trainingRepository.create).mockResolvedValue(mockTraining);
      
      const result = await service.create({
        title: "Test Training",
        videoUrl: "https://youtube.com/watch?v=test123",
      });
      
      expect(result.id).toBe("1");
      expect(trainingRepository.create).toHaveBeenCalled();
    });
  });

  describe("assignToParticipants", () => {
    it("should create training and assign to participants", async () => {
      vi.mocked(trainingRepository.create).mockResolvedValue(mockTraining);
      vi.mocked(assignmentRepository.create).mockResolvedValue(mockAssignment);
      
      const result = await service.assignToParticipants({
        title: "Test Training",
        videoUrl: "https://youtube.com/watch?v=test123",
      }, ["p1", "p2"]);
      
      expect(result.training.id).toBe("1");
      expect(result.assignments).toHaveLength(2);
      expect(trainingRepository.create).toHaveBeenCalled();
      expect(assignmentRepository.create).toHaveBeenCalledTimes(2);
    });

    it("should create training without assignments when no participants", async () => {
      vi.mocked(trainingRepository.create).mockResolvedValue(mockTraining);
      
      const result = await service.assignToParticipants({
        title: "Test Training",
        videoUrl: "https://youtube.com/watch?v=test123",
      }, []);
      
      expect(result.training.id).toBe("1");
      expect(result.assignments).toHaveLength(0);
      expect(assignmentRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should delete training and cascade to assignments", async () => {
      vi.mocked(assignmentRepository.deleteByTrainingId).mockResolvedValue();
      vi.mocked(trainingRepository.delete).mockResolvedValue(true);
      
      await service.delete("1");
      
      expect(assignmentRepository.deleteByTrainingId).toHaveBeenCalledWith("1");
      expect(trainingRepository.delete).toHaveBeenCalledWith("1");
    });

    it("should throw NotFoundError when training not found", async () => {
      vi.mocked(assignmentRepository.deleteByTrainingId).mockResolvedValue();
      vi.mocked(trainingRepository.delete).mockResolvedValue(false);
      
      await expect(service.delete("999")).rejects.toThrow(NotFoundError);
    });
  });
});
