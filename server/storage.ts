import {
  users,
  spreadsheets,
  type User,
  type UpsertUser,
  type Spreadsheet,
  type InsertSpreadsheet,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// Storage interface with user and spreadsheet operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Spreadsheet operations
  getSpreadsheets(userId: string): Promise<Spreadsheet[]>;
  getSpreadsheet(id: string, userId: string): Promise<Spreadsheet | undefined>;
  getSpreadsheetByName(name: string, userId: string): Promise<Spreadsheet | undefined>;
  createSpreadsheet(spreadsheet: InsertSpreadsheet): Promise<Spreadsheet>;
  updateSpreadsheet(id: string, userId: string, data: any): Promise<Spreadsheet>;
  deleteSpreadsheet(id: string, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Spreadsheet operations
  async getSpreadsheets(userId: string): Promise<Spreadsheet[]> {
    return await db
      .select()
      .from(spreadsheets)
      .where(eq(spreadsheets.userId, userId));
  }

  async getSpreadsheet(id: string, userId: string): Promise<Spreadsheet | undefined> {
    const [spreadsheet] = await db
      .select()
      .from(spreadsheets)
      .where(and(eq(spreadsheets.id, id), eq(spreadsheets.userId, userId)));
    return spreadsheet;
  }

  async getSpreadsheetByName(name: string, userId: string): Promise<Spreadsheet | undefined> {
    const [spreadsheet] = await db
      .select()
      .from(spreadsheets)
      .where(and(eq(spreadsheets.name, name), eq(spreadsheets.userId, userId)));
    return spreadsheet;
  }

  async createSpreadsheet(spreadsheetData: InsertSpreadsheet): Promise<Spreadsheet> {
    const [spreadsheet] = await db
      .insert(spreadsheets)
      .values(spreadsheetData)
      .returning();
    return spreadsheet;
  }

  async updateSpreadsheet(id: string, userId: string, data: any): Promise<Spreadsheet> {
    const [spreadsheet] = await db
      .update(spreadsheets)
      .set({ data, updatedAt: new Date() })
      .where(and(eq(spreadsheets.id, id), eq(spreadsheets.userId, userId)))
      .returning();
    return spreadsheet;
  }

  async deleteSpreadsheet(id: string, userId: string): Promise<void> {
    await db
      .delete(spreadsheets)
      .where(and(eq(spreadsheets.id, id), eq(spreadsheets.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
