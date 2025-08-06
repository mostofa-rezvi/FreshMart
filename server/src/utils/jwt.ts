import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { Role } from "@prisma/client";

interface TokenPayload {
  userId: string;
  role: Role;
  vendorProfileId?: string; // Added for vendor
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
};
