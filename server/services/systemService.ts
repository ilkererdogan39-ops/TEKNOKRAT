import { systemRepository } from "../repositories/systemRepository";
import { participantRepository } from "../repositories/participantRepository";
import { trainingRepository } from "../repositories/trainingRepository";
import { assignmentRepository } from "../repositories/assignmentRepository";
import { messageRepository } from "../repositories/messageRepository";
import { videoProgressRepository } from "../repositories/videoProgressRepository";
import { ADMIN_CREDENTIALS } from "@shared/schema";
import { UnauthorizedError } from "../middleware/errorHandler";

let adminPassword = ADMIN_CREDENTIALS.password;

export class SystemService {
  async getMaintenanceMode(): Promise<boolean> {
    const setting = await systemRepository.getSetting("maintenanceMode");
    return setting === "true";
  }

  async setMaintenanceMode(enabled: boolean): Promise<boolean> {
    await systemRepository.setSetting("maintenanceMode", String(enabled));
    return enabled;
  }

  async adminLogin(username: string, password: string): Promise<{ success: boolean }> {
    if (username === ADMIN_CREDENTIALS.username && password === adminPassword) {
      return { success: true };
    }
    throw new UnauthorizedError("Geçersiz kullanıcı adı veya şifre");
  }

  async changeAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    if (currentPassword !== adminPassword) {
      throw new UnauthorizedError("Mevcut şifre yanlış");
    }
    adminPassword = newPassword;
    return { success: true, message: "Şifre başarıyla değiştirildi" };
  }

  async resetAll(): Promise<void> {
    await videoProgressRepository.deleteAll();
    await assignmentRepository.deleteAll();
    await messageRepository.deleteAll();
    await trainingRepository.deleteAll();
    await participantRepository.deleteAll();
    await systemRepository.deleteAllUsers();
  }
}

export const systemService = new SystemService();
