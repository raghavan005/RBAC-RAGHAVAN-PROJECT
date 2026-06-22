import { NextRequest } from "next/server";
import { verifyAccessToken } from "./jwt";

export function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.split(" ")[1];
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}
