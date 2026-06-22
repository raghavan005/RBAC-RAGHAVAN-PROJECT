import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  number?: number;
  phone?: string;
  password: string;
  role: "admin" | "manager" | "member";
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    number: { type: Number, unique: true, sparse: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "manager", "member"], default: "member" },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

function getUserModel(): Model<IUser> {
  if (mongoose.models.User) {
    return mongoose.models.User as Model<IUser>;
  }
  return mongoose.model<IUser>("User", UserSchema);
}

export const User = getUserModel();
