import { describe, it, expect, beforeEach, vi } from "vitest";
import { ParticipantService, sanitizeParticipant } from "../services/participantService";
import { participantRepository } from "../repositories/participantRepository";
import { NotFoundError, ConflictError, UnauthorizedError } from "../middleware/errorHandler";
import type { Participant } from "@shared/schema";

vi.mock("../repositories/participantRepository");
vi.mock("../repositories/assignmentRepository");

const mockParticipant: Participant = {
  id: "1",
  employeeId: "E001",
  fullName: "Test User",
  department: "IT",
  email: "test@example.com",
  password: "secret123",
  hasPassword: true,
};

describe("ParticipantService", () => {
  let service: ParticipantService;

  beforeEach(() => {
    service = new ParticipantService();
    vi.clearAllMocks();
  });

  describe("sanitizeParticipant", () => {
    it("should remove password from participant", () => {
      const result = sanitizeParticipant(mockParticipant);
      expect(result.password).toBeUndefined();
      expect(result.fullName).toBe("Test User");
      expect(result.email).toBe("test@example.com");
    });
  });

  describe("getAll", () => {
    it("should return all participants without passwords", async () => {
      vi.mocked(participantRepository.findAll).mockResolvedValue([mockParticipant]);
      
      const result = await service.getAll();
      
      expect(result).toHaveLength(1);
      expect(result[0].password).toBeUndefined();
      expect(participantRepository.findAll).toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("should return participant by id", async () => {
      vi.mocked(participantRepository.findById).mockResolvedValue(mockParticipant);
      
      const result = await service.getById("1");
      
      expect(result.fullName).toBe("Test User");
      expect(result.password).toBeUndefined();
    });

    it("should throw NotFoundError when participant not found", async () => {
      vi.mocked(participantRepository.findById).mockResolvedValue(undefined);
      
      await expect(service.getById("999")).rejects.toThrow(NotFoundError);
    });
  });

  describe("create", () => {
    it("should create new participant", async () => {
      vi.mocked(participantRepository.findByEmail).mockResolvedValue(undefined);
      vi.mocked(participantRepository.create).mockResolvedValue(mockParticipant);
      
      const result = await service.create({
        employeeId: "E001",
        fullName: "Test User",
        department: "IT",
        email: "test@example.com",
      });
      
      expect(result.fullName).toBe("Test User");
      expect(participantRepository.create).toHaveBeenCalled();
    });

    it("should throw ConflictError when email exists", async () => {
      vi.mocked(participantRepository.findByEmail).mockResolvedValue(mockParticipant);
      
      await expect(service.create({
        employeeId: "E002",
        fullName: "Another User",
        department: "HR",
        email: "test@example.com",
      })).rejects.toThrow(ConflictError);
    });
  });

  describe("identify", () => {
    it("should identify participant by employee id and email", async () => {
      vi.mocked(participantRepository.findByEmployeeIdAndEmail).mockResolvedValue(mockParticipant);
      
      const result = await service.identify("E001", "test@example.com");
      
      expect(result.participantId).toBe("1");
      expect(result.hasPassword).toBe(true);
      expect(result.fullName).toBe("Test User");
    });

    it("should throw NotFoundError when participant not found", async () => {
      vi.mocked(participantRepository.findByEmployeeIdAndEmail).mockResolvedValue(undefined);
      
      await expect(service.identify("E999", "wrong@example.com")).rejects.toThrow(NotFoundError);
    });
  });

  describe("login", () => {
    it("should login with correct password", async () => {
      vi.mocked(participantRepository.findByEmployeeIdAndEmail).mockResolvedValue(mockParticipant);
      
      const result = await service.login("E001", "test@example.com", "secret123");
      
      expect(result.fullName).toBe("Test User");
      expect(result.password).toBeUndefined();
    });

    it("should throw UnauthorizedError with wrong password", async () => {
      vi.mocked(participantRepository.findByEmployeeIdAndEmail).mockResolvedValue(mockParticipant);
      
      await expect(service.login("E001", "test@example.com", "wrongpassword")).rejects.toThrow(UnauthorizedError);
    });

    it("should throw NotFoundError when participant not found", async () => {
      vi.mocked(participantRepository.findByEmployeeIdAndEmail).mockResolvedValue(undefined);
      
      await expect(service.login("E999", "wrong@example.com", "password")).rejects.toThrow(NotFoundError);
    });
  });

  describe("importFromCSV", () => {
    it("should import participants from CSV with comma delimiter", async () => {
      const csv = `EmployeeId,FullName,Department,Email
E001,John Doe,IT,john@example.com
E002,Jane Smith,HR,jane@example.com`;
      
      vi.mocked(participantRepository.findByEmail).mockResolvedValue(undefined);
      vi.mocked(participantRepository.create).mockResolvedValue(mockParticipant);
      
      const result = await service.importFromCSV(csv);
      
      expect(result).toBe(2);
      expect(participantRepository.create).toHaveBeenCalledTimes(2);
    });

    it("should import participants from CSV with semicolon delimiter (Turkish Excel)", async () => {
      const csv = `EmployeeId;FullName;Department;Email
E001;Ahmet Yılmaz;Bilgi İşlem;ahmet@example.com
E002;Ayşe Demir;İnsan Kaynakları;ayse@example.com`;
      
      vi.mocked(participantRepository.findByEmail).mockResolvedValue(undefined);
      vi.mocked(participantRepository.create).mockResolvedValue(mockParticipant);
      
      const result = await service.importFromCSV(csv);
      
      expect(result).toBe(2);
    });

    it("should skip existing emails during import", async () => {
      const csv = `EmployeeId,FullName,Department,Email
E001,John Doe,IT,existing@example.com`;
      
      vi.mocked(participantRepository.findByEmail).mockResolvedValue(mockParticipant);
      
      const result = await service.importFromCSV(csv);
      
      expect(result).toBe(0);
      expect(participantRepository.create).not.toHaveBeenCalled();
    });
  });
});
