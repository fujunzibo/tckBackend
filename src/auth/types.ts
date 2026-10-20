import type { Request } from "express";
export interface Actor {
  id: string;
  domain: "user" | "admin";
  sessionId: string;
  role?: string;
  entryIds?: string[];
}
export interface ApiRequest extends Request {
  actor?: Actor;
  requestId: string;
}
