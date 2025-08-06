// server/src/middleware/rbacMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";

export const authorizeRoles = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message:
          "Unauthorized: No user attached to request (Auth middleware missing or failed)",
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message:
          "Forbidden: You do not have the required role to access this resource.",
      });
    }
    next();
  };
};
