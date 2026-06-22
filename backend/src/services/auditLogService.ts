import { AuditLog } from "../models/AuditLog";

export interface AuditLogQuery {
  page: number;
  limit: number;
}

export async function listAuditLogs(query: AuditLogQuery) {
  const safePage = Math.max(1, query.page);
  const safeLimit = Math.min(100, Math.max(1, query.limit));

  const [total, logs] = await Promise.all([
    AuditLog.countDocuments(),
    AuditLog.find()
      .populate("userId", "name email role")
      .sort({ timestamp: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
  ]);

  return {
    logs,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}
