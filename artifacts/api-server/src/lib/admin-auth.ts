import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

const COOKIE_NAME = "manfaz_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12;

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET must be set for admin sessions");
  return value;
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function makeToken(): string {
  const payload = `${Date.now() + MAX_AGE_SECONDS * 1000}`;
  return `${payload}.${sign(payload)}`;
}

function validToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature || Number(expiresAt) < Date.now()) return false;
  const expected = sign(expiresAt);
  if (signature.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export function setAdminSession(res: Response): void {
  const sameSite = process.env.COOKIE_SAME_SITE === "none" ? "none" : "lax";
  res.cookie(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    sameSite,
    secure: sameSite === "none" || process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS * 1000,
    path: "/",
  });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const cookies = req.headers.cookie?.split(";").reduce<Record<string, string>>((result, item) => {
    const [key, ...rest] = item.trim().split("=");
    if (key) result[key] = decodeURIComponent(rest.join("="));
    return result;
  }, {});

  if (!validToken(cookies?.[COOKIE_NAME])) {
    res.status(401).json({ error: "Admin authentication required" });
    return;
  }
  next();
}