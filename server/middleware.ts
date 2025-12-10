import type { Request, Response, NextFunction } from "express";
import "./types";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Autenticación requerida" });
  }
  next();
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Autenticación requerida" });
  }
  
  // Import storage dynamically to avoid circular dependency
  const { storage } = await import("./storage");
  
  // Reload user to verify current role (prevent stale session privilege escalation)
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Acceso denegado: solo administradores" });
  }
  
  // Update session with current role
  req.session.userRole = user.role;
  
  next();
}

export async function attachUser(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.session?.userId && req.session.userName && req.session.userEmail && req.session.userRole) {
    req.user = {
      id: req.session.userId,
      name: req.session.userName,
      email: req.session.userEmail,
      role: req.session.userRole,
    };
  }
  next();
}
