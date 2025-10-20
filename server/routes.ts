import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./googleAuth";
import { googleDriveService } from "./googleDrive";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Google OAuth authentication
  await setupAuth(app);

  // Google Drive routes (all protected)
  app.get('/api/drive/files', isAuthenticated, async (req: any, res) => {
    try {
      const files = await googleDriveService.listSpreadsheets(req.user);
      res.json(files);
    } catch (error) {
      console.error("Error fetching files from Drive:", error);
      res.status(500).json({ message: "Failed to fetch files from Google Drive" });
    }
  });

  app.post('/api/drive/save', isAuthenticated, async (req: any, res) => {
    try {
      const { name, data } = req.body;
      
      if (!name || !data) {
        return res.status(400).json({ message: "Name and data are required" });
      }

      const file = await googleDriveService.saveSpreadsheet(req.user, name, data);
      res.json(file);
    } catch (error) {
      console.error("Error saving file to Drive:", error);
      res.status(500).json({ message: "Failed to save file to Google Drive" });
    }
  });

  app.get('/api/drive/load/:fileId', isAuthenticated, async (req: any, res) => {
    try {
      const { fileId } = req.params;
      const data = await googleDriveService.loadSpreadsheet(req.user, fileId);
      res.json(data);
    } catch (error) {
      console.error("Error loading file from Drive:", error);
      res.status(500).json({ message: "Failed to load file from Google Drive" });
    }
  });

  app.delete('/api/drive/delete/:fileId', isAuthenticated, async (req: any, res) => {
    try {
      const { fileId } = req.params;
      await googleDriveService.deleteSpreadsheet(req.user, fileId);
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("Error deleting file from Drive:", error);
      res.status(500).json({ message: "Failed to delete file from Google Drive" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
