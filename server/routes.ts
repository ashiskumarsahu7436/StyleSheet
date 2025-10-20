import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertSpreadsheetSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware setup
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Spreadsheet routes (all protected)
  app.get('/api/spreadsheets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const spreadsheets = await storage.getSpreadsheets(userId);
      res.json(spreadsheets);
    } catch (error) {
      console.error("Error fetching spreadsheets:", error);
      res.status(500).json({ message: "Failed to fetch spreadsheets" });
    }
  });

  app.get('/api/spreadsheets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const spreadsheet = await storage.getSpreadsheet(req.params.id, userId);
      
      if (!spreadsheet) {
        return res.status(404).json({ message: "Spreadsheet not found" });
      }
      
      res.json(spreadsheet);
    } catch (error) {
      console.error("Error fetching spreadsheet:", error);
      res.status(500).json({ message: "Failed to fetch spreadsheet" });
    }
  });

  app.post('/api/spreadsheets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const validatedData = insertSpreadsheetSchema.parse({
        ...req.body,
        userId,
      });

      // Check if spreadsheet with same name exists
      const existing = await storage.getSpreadsheetByName(validatedData.name, userId);
      
      if (existing) {
        return res.status(409).json({ 
          message: "Spreadsheet with this name already exists",
          existingId: existing.id 
        });
      }

      const spreadsheet = await storage.createSpreadsheet(validatedData);
      res.json(spreadsheet);
    } catch (error) {
      console.error("Error creating spreadsheet:", error);
      res.status(500).json({ message: "Failed to create spreadsheet" });
    }
  });

  app.put('/api/spreadsheets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const spreadsheet = await storage.updateSpreadsheet(
        req.params.id,
        userId,
        req.body.data
      );
      
      if (!spreadsheet) {
        return res.status(404).json({ message: "Spreadsheet not found" });
      }
      
      res.json(spreadsheet);
    } catch (error) {
      console.error("Error updating spreadsheet:", error);
      res.status(500).json({ message: "Failed to update spreadsheet" });
    }
  });

  app.delete('/api/spreadsheets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteSpreadsheet(req.params.id, userId);
      res.json({ message: "Spreadsheet deleted successfully" });
    } catch (error) {
      console.error("Error deleting spreadsheet:", error);
      res.status(500).json({ message: "Failed to delete spreadsheet" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
