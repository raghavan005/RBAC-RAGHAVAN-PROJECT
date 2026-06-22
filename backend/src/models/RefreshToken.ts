import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
RefreshTokenSchema.index({ token: 1 });

function getRefreshTokenModel(): Model<IRefreshToken> {
  if (mongoose.models.RefreshToken) {
    return mongoose.models.RefreshToken as Model<IRefreshToken>;
  }
  return mongoose.model<IRefreshToken>("RefreshToken", RefreshTokenSchema);
}

export const RefreshToken = getRefreshTokenModel();
