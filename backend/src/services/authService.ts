import bcrypt from "bcryptjs";
import { User, type IUser } from "../models/User";
import { RefreshToken } from "../models/RefreshToken";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import type { RegisterDTO, LoginDTO } from "../validators/auth";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function formatUser(user: IUser) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    number: user.number,
    phone: user.phone,
    role: user.role,
    status: user.status,
  };
}

export async function registerUser(dto: RegisterDTO) {
  const existing = await User.findOne({ email: dto.email });
  if (existing) {
    const err = new Error("Email already registered") as Error & { statusCode: number };
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(dto.password, 12);
  const user = await User.create({
    name: dto.name,
    email: dto.email,
    password: hashedPassword,
    number: dto.number,
    phone: dto.phone,
    role: dto.role ?? "member",
  });

  const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
  const refreshToken = signRefreshToken({ userId: user._id.toString() });

  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  return { accessToken, refreshToken, user: formatUser(user) };
}

export async function loginUser(dto: LoginDTO) {
  const user = await User.findOne({ email: dto.email });
  if (!user) {
    const err = new Error("Invalid credentials") as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }

  const valid = await bcrypt.compare(dto.password, user.password);
  if (!valid) {
    const err = new Error("Invalid credentials") as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }

  const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
  const refreshToken = signRefreshToken({ userId: user._id.toString() });

  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  return { accessToken, refreshToken, user: formatUser(user) };
}

export async function refreshTokens(token: string) {
  const stored = await RefreshToken.findOne({ token });
  if (!stored) {
    const err = new Error("Invalid refresh token") as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }

  let payload: { userId: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    await RefreshToken.deleteOne({ token });
    const err = new Error("Refresh token expired") as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }

  const user = await User.findById(payload.userId);
  if (!user) {
    await RefreshToken.deleteOne({ token });
    const err = new Error("User not found") as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }

  // Rotate: delete old, create new
  await RefreshToken.deleteOne({ token });

  const newRefreshToken = signRefreshToken({ userId: user._id.toString() });
  await RefreshToken.create({
    userId: user._id,
    token: newRefreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logoutUser(token: string) {
  await RefreshToken.deleteOne({ token });
}

export async function getProfile(userId: string) {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    const err = new Error("User not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }
  return user;
}
