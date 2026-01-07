import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { ZodError, z } from "zod";
import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  errorHandler,
  asyncHandler,
} from "../middleware/errorHandler";

describe("Error Classes", () => {
  describe("AppError", () => {
    it("should create error with default status code 500", () => {
      const error = new AppError("Something went wrong");
      expect(error.message).toBe("Something went wrong");
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe("AppError");
    });

    it("should create error with custom status code", () => {
      const error = new AppError("Bad request", 400, "BAD_REQUEST");
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("BAD_REQUEST");
    });
  });

  describe("NotFoundError", () => {
    it("should create 404 error", () => {
      const error = new NotFoundError();
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("NOT_FOUND");
    });

    it("should accept custom message", () => {
      const error = new NotFoundError("User not found");
      expect(error.message).toBe("User not found");
    });
  });

  describe("ValidationError", () => {
    it("should create 400 error", () => {
      const error = new ValidationError();
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("UnauthorizedError", () => {
    it("should create 401 error", () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("ForbiddenError", () => {
    it("should create 403 error", () => {
      const error = new ForbiddenError();
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe("FORBIDDEN");
    });
  });

  describe("ConflictError", () => {
    it("should create 409 error", () => {
      const error = new ConflictError();
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe("CONFLICT");
    });
  });
});

describe("errorHandler middleware", () => {
  const mockRequest = {} as Request;
  const mockNext = vi.fn() as NextFunction;

  const createMockResponse = () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    return res;
  };

  it("should handle AppError", () => {
    const mockResponse = createMockResponse();
    const error = new NotFoundError("Resource not found");

    errorHandler(error, mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: "Resource not found",
      code: "NOT_FOUND",
    });
  });

  it("should handle ZodError", () => {
    const mockResponse = createMockResponse();
    const schema = z.object({ name: z.string() });
    let zodError: ZodError | null = null;
    
    try {
      schema.parse({ name: 123 });
    } catch (e) {
      zodError = e as ZodError;
    }

    if (zodError) {
      errorHandler(zodError, mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Geçersiz veri",
          code: "VALIDATION_ERROR",
        })
      );
    }
  });

  it("should handle generic Error", () => {
    const mockResponse = createMockResponse();
    const error = new Error("Something unexpected");

    errorHandler(error, mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: "Sunucu hatası",
      code: "INTERNAL_ERROR",
    });
  });
});

describe("asyncHandler", () => {
  it("should pass result for successful async function", async () => {
    const mockRequest = {} as Request;
    const mockResponse = {
      json: vi.fn(),
    } as unknown as Response;
    const mockNext = vi.fn() as NextFunction;

    const handler = asyncHandler(async (_req, res, _next) => {
      res.json({ success: true });
    });

    await handler(mockRequest, mockResponse, mockNext);

    expect(mockResponse.json).toHaveBeenCalledWith({ success: true });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should call next with error for failed async function", async () => {
    const mockRequest = {} as Request;
    const mockResponse = {} as Response;
    const mockNext = vi.fn() as NextFunction;
    const testError = new Error("Test error");

    const handler = asyncHandler(async () => {
      throw testError;
    });

    await handler(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalledWith(testError);
  });
});
