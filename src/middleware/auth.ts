import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "";

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * Auth middleware — validates JWT from Authorization header.
 * Uses the same JWT_SECRET as openmedia-api for token validation.
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!JWT_SECRET) {
    console.error("[auth] JWT_SECRET is not configured");
    res.status(500).json({ error: "Server ist nicht korrekt konfiguriert." });
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Nicht authentifiziert." });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token abgelaufen." });
      return;
    }
    res.status(401).json({ error: "Ungültiger Token." });
    return;
  }
}
