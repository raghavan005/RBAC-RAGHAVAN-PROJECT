import { Request, Response, NextFunction } from "express";
import { registerSchema, loginSchema } from "../validators/auth";
import * as authService from "../services/authService";
import { createAuditLog } from "../utils/auditLog";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      res.status(400).json({ error: details[0].message, details });
      return;
    }

    const { accessToken, refreshToken, user } = await authService.registerUser(parsed.data);

    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
    await createAuditLog(String(user.id), "REGISTER", `user:${user.id}`);

    res.status(201).json({ accessToken, user });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      res.status(400).json({ error: details[0].message, details });
      return;
    }

    const { accessToken, refreshToken, user } = await authService.loginUser(parsed.data);

    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
    await createAuditLog(String(user.id), "LOGIN", `user:${user.id}`);

    res.json({ accessToken, user });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token: string | undefined = req.cookies?.refreshToken;

    if (!token) {
      res.status(401).json({ error: "No refresh token" });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } = await authService.refreshTokens(token);

    res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token: string | undefined = req.cookies?.refreshToken;

    if (token) {
      await authService.logoutUser(token);
      if (req.user) {
        await createAuditLog(req.user.userId, "LOGOUT", `user:${req.user.userId}`);
      }
    }

    res.clearCookie("refreshToken", { path: "/" });
    res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
}

export async function profile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getProfile(req.user!.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
