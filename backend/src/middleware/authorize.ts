import { Request, Response, NextFunction } from "express";
import { hasPermission, type Permission } from "../utils/rbac";

/**
 * Returns middleware that checks whether the authenticated user
 * holds the required RBAC permission. Must be used after authenticate().
 */
export function authorize(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      res.status(403).json({ error: "Forbidden: insufficient permissions" });
      return;
    }

    next();
  };
}
