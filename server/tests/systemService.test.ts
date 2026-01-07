import { describe, it, expect, beforeEach, vi } from "vitest";
import { SystemService } from "../services/systemService";
import { systemRepository } from "../repositories/systemRepository";
import { UnauthorizedError } from "../middleware/errorHandler";
import { ADMIN_CREDENTIALS } from "@shared/schema";

vi.mock("../repositories/systemRepository");
vi.mock("../repositories/participantRepository");
vi.mock("../repositories/trainingRepository");
vi.mock("../repositories/assignmentRepository");
vi.mock("../repositories/messageRepository");
vi.mock("../repositories/videoProgressRepository");

describe("SystemService", () => {
  let service: SystemService;

  beforeEach(() => {
    service = new SystemService();
    vi.clearAllMocks();
  });

  describe("getMaintenanceMode", () => {
    it("should return true when maintenance mode is enabled", async () => {
      vi.mocked(systemRepository.getSetting).mockResolvedValue("true");
      
      const result = await service.getMaintenanceMode();
      
      expect(result).toBe(true);
      expect(systemRepository.getSetting).toHaveBeenCalledWith("maintenanceMode");
    });

    it("should return false when maintenance mode is disabled", async () => {
      vi.mocked(systemRepository.getSetting).mockResolvedValue("false");
      
      const result = await service.getMaintenanceMode();
      
      expect(result).toBe(false);
    });

    it("should return false when setting does not exist", async () => {
      vi.mocked(systemRepository.getSetting).mockResolvedValue(undefined);
      
      const result = await service.getMaintenanceMode();
      
      expect(result).toBe(false);
    });
  });

  describe("setMaintenanceMode", () => {
    it("should enable maintenance mode", async () => {
      vi.mocked(systemRepository.setSetting).mockResolvedValue();
      
      const result = await service.setMaintenanceMode(true);
      
      expect(result).toBe(true);
      expect(systemRepository.setSetting).toHaveBeenCalledWith("maintenanceMode", "true");
    });

    it("should disable maintenance mode", async () => {
      vi.mocked(systemRepository.setSetting).mockResolvedValue();
      
      const result = await service.setMaintenanceMode(false);
      
      expect(result).toBe(false);
      expect(systemRepository.setSetting).toHaveBeenCalledWith("maintenanceMode", "false");
    });
  });

  describe("adminLogin", () => {
    it("should login with correct credentials", async () => {
      const result = await service.adminLogin(
        ADMIN_CREDENTIALS.username,
        ADMIN_CREDENTIALS.password
      );
      
      expect(result).toEqual({ success: true });
    });

    it("should throw UnauthorizedError with wrong username", async () => {
      await expect(
        service.adminLogin("wronguser", ADMIN_CREDENTIALS.password)
      ).rejects.toThrow(UnauthorizedError);
    });

    it("should throw UnauthorizedError with wrong password", async () => {
      await expect(
        service.adminLogin(ADMIN_CREDENTIALS.username, "wrongpassword")
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("changeAdminPassword", () => {
    it("should change password with correct current password", async () => {
      const newPassword = "newpassword123";
      
      const result = await service.changeAdminPassword(
        ADMIN_CREDENTIALS.password,
        newPassword
      );
      
      expect(result.success).toBe(true);
      expect(result.message).toBe("Şifre başarıyla değiştirildi");
      
      const loginResult = await service.adminLogin(ADMIN_CREDENTIALS.username, newPassword);
      expect(loginResult.success).toBe(true);
    });

    it("should throw UnauthorizedError with wrong current password", async () => {
      await expect(
        service.changeAdminPassword("wrongcurrent", "newpassword")
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
