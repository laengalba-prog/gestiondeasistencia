import "express-session";

declare module "express-session" {
  interface SessionData {
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
  }
}

export {};
