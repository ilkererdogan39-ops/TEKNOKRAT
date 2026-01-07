import { describe, it, expect, beforeEach, vi } from "vitest";
import { AssignmentService } from "../services/assignmentService";
import { assignmentRepository } from "../repositories/assignmentRepository";
import { trainingRepository } from "../repositories/trainingRepository";
import { NotFoundError } from "../middleware/errorHandler";
import type { Training, TrainingAssignment } from "../../shared/schema";

vi.mock("../repositories/assignmentRepository");
vi.mock("../repositories/trainingRepository");

const mockTraining: Training = {
  id: "t1",
  title: "Test Training",
  videoUrl: "https://youtube.com/watch?v=test123",
  createdAt: new Date(),
};

const mockAssignment: TrainingAssignment = {
  id: "a1",
  participantId: "p1",
  trainingId: "t1",
  completed: false,
  completedAt: null,
  assignedAt: new Date(),
  progress: 0,
};

const mockCompletedAssignment: TrainingAssignment = {
  ...mockAssignment,
  id: "a2",
  completed: true,
  completedAt: new Date(),
  progress: 100,
};

describe("AssignmentService", () => {
  let service: AssignmentService;

  beforeEach(() => {
    service = new AssignmentService();
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("should return all assignments", async () => {
      vi.mocked(assignmentRepository.findAll).mockResolvedValue([mockAssignment, mockCompletedAssignment]);
      
      const result = await service.getAll();
      
      expect(result).toHaveLength(2);
      expect(assignmentRepository.findAll).toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("should return assignment by id", async () => {
      vi.mocked(assignmentRepository.findById).mockResolvedValue(mockAssignment);
      
      const result = await service.getById("a1");
      
      expect(result.id).toBe("a1");
      expect(assignmentRepository.findById).toHaveBeenCalledWith("a1");
    });

    it("should throw NotFoundError when assignment not found", async () => {
      vi.mocked(assignmentRepository.findById).mockResolvedValue(undefined);
      
      await expect(service.getById("a999")).rejects.toThrow(NotFoundError);
    });
  });

  describe("getByParticipantId", () => {
    it("should return assignments with training details for participant", async () => {
      vi.mocked(assignmentRepository.findByParticipantId).mockResolvedValue([mockAssignment]);
      vi.mocked(trainingRepository.findAll).mockResolvedValue([mockTraining]);
      
      const result = await service.getByParticipantId("p1");
      
      expect(result).toHaveLength(1);
      expect(result[0].assignment.participantId).toBe("p1");
      expect(result[0].training.title).toBe("Test Training");
    });

    it("should return empty array when participant has no assignments", async () => {
      vi.mocked(assignmentRepository.findByParticipantId).mockResolvedValue([]);
      vi.mocked(trainingRepository.findAll).mockResolvedValue([]);
      
      const result = await service.getByParticipantId("p999");
      
      expect(result).toHaveLength(0);
    });

    it("should filter out assignments with missing trainings", async () => {
      vi.mocked(assignmentRepository.findByParticipantId).mockResolvedValue([mockAssignment]);
      vi.mocked(trainingRepository.findAll).mockResolvedValue([]);
      
      const result = await service.getByParticipantId("p1");
      
      expect(result).toHaveLength(0);
    });
  });

  describe("complete", () => {
    it("should mark assignment as complete", async () => {
      vi.mocked(assignmentRepository.complete).mockResolvedValue(mockCompletedAssignment);
      
      const result = await service.complete("a1");
      
      expect(result.completed).toBe(true);
      expect(assignmentRepository.complete).toHaveBeenCalledWith("a1");
    });

    it("should throw NotFoundError when assignment not found", async () => {
      vi.mocked(assignmentRepository.complete).mockResolvedValue(undefined);
      
      await expect(service.complete("a999")).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateProgress", () => {
    it("should update assignment progress", async () => {
      vi.mocked(assignmentRepository.updateProgress).mockResolvedValue();
      
      await service.updateProgress("a1", 50);
      
      expect(assignmentRepository.updateProgress).toHaveBeenCalledWith("a1", 50);
    });
  });
});
