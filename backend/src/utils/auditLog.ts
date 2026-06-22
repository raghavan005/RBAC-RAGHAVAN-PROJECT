import mongoose from "mongoose";
import { AuditLog, type AuditAction } from "../models/AuditLog";

/**
 * Creates an audit log entry. Failures are silently ignored so they
 * never break the primary operation that triggered them.
 */
export async function createAuditLog(
  userId: string | mongoose.Types.ObjectId,
  action: AuditAction,
  resource: string
): Promise<void> {
  try {
    await AuditLog.create({ userId, action, resource });
  } catch (err) {
    console.error("Audit log creation failed:", err);
  }
}
