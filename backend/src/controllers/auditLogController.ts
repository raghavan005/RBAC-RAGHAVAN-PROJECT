import { Request, Response, NextFunction } from "express";
import * as auditLogService from "../services/auditLogService";

export async function getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(String(req.query.page ?? "1"));
    const limit = parseInt(String(req.query.limit ?? "20"));

    const result = await auditLogService.listAuditLogs({ page, limit });
    res.json(result);
  } catch (err) {
    next(err);
  }
}
