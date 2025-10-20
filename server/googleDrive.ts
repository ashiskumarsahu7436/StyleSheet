import { google } from "googleapis";
import type { User } from "@shared/schema";

export class GoogleDriveService {
  // Dedicated folder name for StyleSheet app files
  private readonly FOLDER_NAME = "StyleSheet Files";

  private getOAuth2Client(user: User) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    return oauth2Client;
  }

  private getDriveClient(user: User) {
    const auth = this.getOAuth2Client(user);
    return google.drive({ version: "v3", auth });
  }

  // Get or create the dedicated StyleSheet folder
  private async getOrCreateFolder(user: User): Promise<string> {
    const drive = this.getDriveClient(user);

    try {
      // Check if folder already exists
      const response = await drive.files.list({
        q: `name='${this.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: "files(id, name)",
        pageSize: 1,
      });

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id!;
      }

      // Create folder if it doesn't exist
      const folderMetadata = {
        name: this.FOLDER_NAME,
        mimeType: "application/vnd.google-apps.folder",
      };

      const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: "id",
      });

      return folder.data.id!;
    } catch (error) {
      console.error("Error getting/creating folder:", error);
      throw error;
    }
  }

  // List all spreadsheet files from the dedicated folder only
  async listSpreadsheets(user: User) {
    const drive = this.getDriveClient(user);
    
    try {
      const folderId = await this.getOrCreateFolder(user);

      const response = await drive.files.list({
        q: `'${folderId}' in parents and mimeType='application/json' and name contains '.stylesheet' and trashed=false`,
        fields: "files(id, name, modifiedTime, createdTime)",
        orderBy: "modifiedTime desc",
        pageSize: 100,
      });

      return response.data.files || [];
    } catch (error) {
      console.error("Error listing files from Drive:", error);
      throw error;
    }
  }

  // Save spreadsheet to Google Drive (in dedicated folder only)
  async saveSpreadsheet(user: User, name: string, data: any) {
    const drive = this.getDriveClient(user);
    
    try {
      const folderId = await this.getOrCreateFolder(user);
      
      const fileMetadata = {
        name: `${name}.stylesheet.json`,
        mimeType: "application/json",
        parents: [folderId], // Save in dedicated folder
      };

      const media = {
        mimeType: "application/json",
        body: JSON.stringify(data, null, 2),
      };

      // Check if file already exists in the folder
      const existingFiles = await drive.files.list({
        q: `name='${name}.stylesheet.json' and '${folderId}' in parents and trashed=false`,
        fields: "files(id, name)",
        pageSize: 1,
      });

      let fileId: string;

      if (existingFiles.data.files && existingFiles.data.files.length > 0) {
        // Update existing file
        fileId = existingFiles.data.files[0].id!;
        await drive.files.update({
          fileId: fileId,
          media: media as any,
          fields: "id, name, modifiedTime",
        });
      } else {
        // Create new file in the folder
        const response = await drive.files.create({
          requestBody: fileMetadata,
          media: media as any,
          fields: "id, name, createdTime, modifiedTime",
        });
        fileId = response.data.id!;
      }

      return {
        id: fileId,
        name: fileMetadata.name,
      };
    } catch (error) {
      console.error("Error saving file to Drive:", error);
      throw error;
    }
  }

  // Load spreadsheet from Google Drive
  async loadSpreadsheet(user: User, fileId: string) {
    const drive = this.getDriveClient(user);
    
    try {
      const response = await drive.files.get({
        fileId: fileId,
        alt: "media",
      });

      return response.data;
    } catch (error) {
      console.error("Error loading file from Drive:", error);
      throw error;
    }
  }

  // Delete spreadsheet from Google Drive
  async deleteSpreadsheet(user: User, fileId: string) {
    const drive = this.getDriveClient(user);
    
    try {
      await drive.files.delete({
        fileId: fileId,
      });
      return { success: true };
    } catch (error) {
      console.error("Error deleting file from Drive:", error);
      throw error;
    }
  }
}

export const googleDriveService = new GoogleDriveService();
