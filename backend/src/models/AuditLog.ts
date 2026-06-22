import mongoose, { Schema, Document, Model } from "mongoose";

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "REGISTER"
  | "CREATE_MEMBER"
  | "UPDATE_MEMBER"
  | "DELETE_MEMBER";

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: AuditAction;
  resource: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  action: {
    type: String,
    enum: ["LOGIN", "LOGOUT", "REGISTER", "CREATE_MEMBER", "UPDATE_MEMBER", "DELETE_MEMBER"],
    required: true,
  },
  resource: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ userId: 1 });

function getAuditLogModel(): Model<IAuditLog> {
  if (mongoose.models.AuditLog) {
    return mongoose.models.AuditLog as Model<IAuditLog>;
  }
  return mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
}

export const AuditLog = getAuditLogModel();
