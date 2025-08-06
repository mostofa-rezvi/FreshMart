import { Request } from "express";
import { Role } from "@prisma/client";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      role: Role;
      vendorProfileId?: string; // Add this for vendor identification
    };
  }
}
