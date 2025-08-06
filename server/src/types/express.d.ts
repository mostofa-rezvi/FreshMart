import { Request } from "express";
import { Role } from "@prisma/client";

// Extend the Request interface to include user property
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      role: Role;
    };
  }
}
