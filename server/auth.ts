import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { InsertUser, User } from "@shared/schema";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function registerUser(userData: InsertUser): Promise<User | null> {
  const hashedPassword = await hashPassword(userData.password);
  return storage.createUser({
    ...userData,
    password: hashedPassword,
  });
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = await storage.getUserByEmail(email);
  if (!user) return null;
  
  const isValid = await comparePassword(password, user.password);
  if (!isValid) return null;
  
  return user;
}

export function isAdmin(user: User): boolean {
  return user.role === "admin";
}

export function sanitizeUser(user: User): Omit<User, "password"> {
  const { password, ...sanitized } = user;
  return sanitized;
}
