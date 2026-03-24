import { Request } from "express";

// JWT Payload types
export interface TokenPayload {
  userId: string;
  role: "user" | "business" | "staff";
  iat?: number;
  exp?: number;
  jti?: string;
}

export interface RefreshTokenPayload extends TokenPayload {
  type: "refresh";
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export {};
