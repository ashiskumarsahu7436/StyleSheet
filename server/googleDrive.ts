import { google } from "googleapis";
import type { User } from "@shared/schema";
import ExcelJS from "exceljs";

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
        q: `'${folderId}' in parents and name contains '.xlsx' and trashed=false`,
        fields: "files(id, name, modifiedTime, createdTime)",
        orderBy: "modifiedTime desc",
        pageSize: 100,
      });

      // Map modifiedTime to updatedAt for frontend compatibility
      const files = (response.data.files || []).map(file => ({
        id: file.id,
        name: file.name,
        updatedAt: file.modifiedTime,
        createdAt: file.createdTime,
      }));

      return files;
    } catch (error) {
      console.error("Error listing files from Drive:", error);
      throw error;
    }
  }

  // Convert spreadsheet data to Excel format
  private async convertToExcel(data: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const { sheets } = data;

    for (const sheet of sheets) {
      const worksheet = workbook.addWorksheet(sheet.name);
      
      // Set column widths
      if (sheet.columnWidths) {
        const colWidths = sheet.columnWidths instanceof Map 
          ? sheet.columnWidths 
          : new Map(Object.entries(sheet.columnWidths));
        
        colWidths.forEach((width, col) => {
          const colNumber = typeof col === 'string' ? parseInt(col) : col;
          worksheet.getColumn(colNumber + 1).width = width / 7;
        });
      }

      // Set row heights
      if (sheet.rowHeights) {
        const rowHeights = sheet.rowHeights instanceof Map
          ? sheet.rowHeights
          : new Map(Object.entries(sheet.rowHeights));
        
        rowHeights.forEach((height, row) => {
          const rowNumber = typeof row === 'string' ? parseInt(row) : row;
          worksheet.getRow(rowNumber + 1).height = height;
        });
      }

      // Add cell data
      const cellData = sheet.cellData instanceof Map 
        ? sheet.cellData 
        : new Map(Object.entries(sheet.cellData || {}));
      
      cellData.forEach((cellValue, cellAddress) => {
        const cell = worksheet.getCell(cellAddress);
        
        if (typeof cellValue === 'object' && cellValue !== null) {
          cell.value = cellValue.value || cellValue.displayValue || '';
          
          // Apply formatting
          if (cellValue.bold) cell.font = { ...cell.font, bold: true };
          if (cellValue.italic) cell.font = { ...cell.font, italic: true };
          if (cellValue.underline) cell.font = { ...cell.font, underline: true };
          if (cellValue.fontSize) cell.font = { ...cell.font, size: cellValue.fontSize };
          if (cellValue.fontColor) cell.font = { ...cell.font, color: { argb: cellValue.fontColor.replace('#', 'FF') } };
          if (cellValue.backgroundColor) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: cellValue.backgroundColor.replace('#', 'FF') }
            };
          }
          if (cellValue.textAlign) cell.alignment = { ...cell.alignment, horizontal: cellValue.textAlign };
        } else {
          cell.value = cellValue;
        }
      });

      // Handle merged cells
      if (sheet.mergedCells && sheet.mergedCells.length > 0) {
        sheet.mergedCells.forEach((range: string) => {
          worksheet.mergeCells(range);
        });
      }
    }

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  // Save spreadsheet to Google Drive (in dedicated folder only)
  async saveSpreadsheet(user: User, name: string, data: any) {
    const drive = this.getDriveClient(user);
    
    try {
      const folderId = await this.getOrCreateFolder(user);
      
      // Ensure name ends with .xlsx
      const fileName = name.endsWith('.xlsx') ? name : `${name}.xlsx`;
      
      const fileMetadata = {
        name: fileName,
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        parents: [folderId],
      };

      // Convert spreadsheet data to Excel format
      const excelBuffer = await this.convertToExcel(data);

      const media = {
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        body: excelBuffer,
      };

      // Check if file already exists in the folder
      const existingFiles = await drive.files.list({
        q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
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
        name: fileName,
      };
    } catch (error) {
      console.error("Error saving file to Drive:", error);
      throw error;
    }
  }

  // Convert Excel file back to spreadsheet format
  private async convertFromExcel(buffer: Buffer): Promise<any> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheets = workbook.worksheets.map((worksheet) => {
      const cellData: Record<string, any> = {};
      const columnWidths: Record<number, number> = {};
      const rowHeights: Record<number, number> = {};
      const mergedCells: string[] = [];

      // Get column widths
      worksheet.columns.forEach((column, index) => {
        if (column.width) {
          columnWidths[index] = column.width * 7;
        }
      });

      // Get row heights
      worksheet.eachRow((row, rowNumber) => {
        if (row.height) {
          rowHeights[rowNumber - 1] = row.height;
        }
      });

      // Get cell data
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
          const address = this.numberToColumnLetter(colNumber) + rowNumber;
          const value = cell.value;
          
          // Handle formula results
          const displayValue = cell.type === ExcelJS.ValueType.Formula 
            ? (cell.result || '') 
            : value;

          cellData[address] = {
            value: typeof value === 'object' && value !== null && 'result' in value ? value.result : value,
            displayValue: displayValue?.toString() || '',
            bold: cell.font?.bold || false,
            italic: cell.font?.italic || false,
            underline: cell.font?.underline || false,
            fontSize: cell.font?.size || 11,
            fontColor: cell.font?.color?.argb ? `#${cell.font.color.argb.slice(2)}` : '#000000',
            backgroundColor: cell.fill?.type === 'pattern' && cell.fill.fgColor?.argb 
              ? `#${cell.fill.fgColor.argb.slice(2)}` 
              : 'transparent',
            textAlign: cell.alignment?.horizontal || 'left',
          };
        });
      });

      // Get merged cells
      if (worksheet.model.merges) {
        worksheet.model.merges.forEach((range: string) => {
          mergedCells.push(range);
        });
      }

      return {
        id: worksheet.id.toString(),
        name: worksheet.name,
        cellData,
        columnWidths,
        rowHeights,
        mergedCells,
        history: [],
        historyIndex: -1,
      };
    });

    return {
      sheets,
      activeSheetId: sheets[0]?.id || '1',
    };
  }

  // Helper to convert column number to letter
  private numberToColumnLetter(num: number): string {
    let letter = '';
    while (num > 0) {
      const remainder = (num - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      num = Math.floor((num - 1) / 26);
    }
    return letter;
  }

  // Load spreadsheet from Google Drive
  async loadSpreadsheet(user: User, fileId: string) {
    const drive = this.getDriveClient(user);
    
    try {
      const response = await drive.files.get({
        fileId: fileId,
        alt: "media",
      }, {
        responseType: 'arraybuffer',
      });

      const buffer = Buffer.from(response.data as ArrayBuffer);
      return await this.convertFromExcel(buffer);
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
