import { useState, useEffect, useRef, useCallback } from "react";
import SpreadsheetGrid from "@/components/SpreadsheetGrid";
import ControlPanel from "@/components/ControlPanel";
import GoogleSheetsToolbar from "@/components/GoogleSheetsToolbar";
import SheetTabs from "@/components/SheetTabs";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface CellData {
  address: string;
  value: string;
  backgroundColor?: string;
  color?: string; // Text color
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  fontStyle?: string;
  textDecoration?: string;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
}

interface MergedCell {
  startAddress: string;
  endAddress: string;
  colspan: number;
  rowspan: number;
  originalCells?: Map<string, CellData>;
}

interface Sheet {
  id: string;
  name: string;
  cellData: Map<string, CellData>;
  mergedCells: MergedCell[];
  columnWidths: Map<number, number>;
  rowHeights: Map<number, number>;
  history: { 
    cellData: Map<string, CellData>; 
    mergedCells: MergedCell[];
    columnWidths: Map<number, number>;
    rowHeights: Map<number, number>;
  }[];
  historyIndex: number;
}

export default function Home() {
  const { toast } = useToast();
  const [sheets, setSheets] = useState<Sheet[]>([
    {
      id: "sheet-1",
      name: "Sheet1",
      cellData: new Map(),
      mergedCells: [],
      columnWidths: new Map(),
      rowHeights: new Map(),
      history: [{ 
        cellData: new Map(), 
        mergedCells: [],
        columnWidths: new Map(),
        rowHeights: new Map()
      }],
      historyIndex: 0,
    },
  ]);
  const [activeSheetId, setActiveSheetId] = useState("sheet-1");
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  const [temporarySelectedCells, setTemporarySelectedCells] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [outputValue, setOutputValue] = useState("");
  const [customFormulas, setCustomFormulas] = useState<Array<{ name: string; logic: string }>>([]);
  const [retainSelection, setRetainSelection] = useState(false);
  const [spreadsheetName, setSpreadsheetName] = useState("My Spreadsheet");
  const [isComplexMode, setIsComplexMode] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadFileName, setDownloadFileName] = useState("");
  const [defaultFormatting, setDefaultFormatting] = useState<{
    fontSize?: number;
    fontWeight?: string;
    fontFamily?: string;
    fontStyle?: string;
    textDecoration?: string;
    backgroundColor?: string;
  }>({
    fontSize: 11, // Default 11pt (Google Sheets standard)
  });
  const tempSelectionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get current active sheet
  const activeSheet = sheets.find(s => s.id === activeSheetId) || sheets[0];
  const cellData = activeSheet.cellData;
  const mergedCells = activeSheet.mergedCells;
  const columnWidths = activeSheet.columnWidths;
  const rowHeights = activeSheet.rowHeights;
  const history = activeSheet.history;
  const historyIndex = activeSheet.historyIndex;

  // Update active sheet data
  const updateActiveSheet = (updates: Partial<Sheet>) => {
    setSheets(prev => prev.map(sheet => 
      sheet.id === activeSheetId ? { ...sheet, ...updates } : sheet
    ));
  };

  const setCellData = (dataOrFn: Map<string, CellData> | ((prev: Map<string, CellData>) => Map<string, CellData>)) => {
    if (typeof dataOrFn === 'function') {
      const newData = dataOrFn(cellData);
      updateActiveSheet({ cellData: newData });
    } else {
      updateActiveSheet({ cellData: dataOrFn });
    }
  };
  
  const setMergedCells = (cells: MergedCell[]) => updateActiveSheet({ mergedCells: cells });
  
  const setColumnWidths = (widthsOrFn: Map<number, number> | ((prev: Map<number, number>) => Map<number, number>)) => {
    if (typeof widthsOrFn === 'function') {
      const newWidths = widthsOrFn(columnWidths);
      updateActiveSheet({ columnWidths: newWidths });
    } else {
      updateActiveSheet({ columnWidths: widthsOrFn });
    }
  };
  
  const setRowHeights = (heightsOrFn: Map<number, number> | ((prev: Map<number, number>) => Map<number, number>)) => {
    if (typeof heightsOrFn === 'function') {
      const newHeights = heightsOrFn(rowHeights);
      updateActiveSheet({ rowHeights: newHeights });
    } else {
      updateActiveSheet({ rowHeights: heightsOrFn });
    }
  };
  
  const setHistory = (hist: { 
    cellData: Map<string, CellData>; 
    mergedCells: MergedCell[];
    columnWidths: Map<number, number>;
    rowHeights: Map<number, number>;
  }[]) => updateActiveSheet({ history: hist });
  const setHistoryIndex = (index: number) => updateActiveSheet({ historyIndex: index });

  const saveToHistory = (
    newCellData: Map<string, CellData>, 
    newMergedCells: MergedCell[] = mergedCells,
    newColumnWidths: Map<number, number> = columnWidths,
    newRowHeights: Map<number, number> = rowHeights
  ) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ 
      cellData: new Map(newCellData), 
      mergedCells: [...newMergedCells],
      columnWidths: new Map(newColumnWidths),
      rowHeights: new Map(newRowHeights)
    });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const getColumnLabel = (index: number): string => {
    let label = "";
    let num = index;
    while (num >= 0) {
      label = String.fromCharCode(65 + (num % 26)) + label;
      num = Math.floor(num / 26) - 1;
    }
    return label;
  };

  // Helper function to convert column label (like "A", "B", "AZ") to index
  const getColumnIndex = (label: string): number => {
    let index = 0;
    for (let i = 0; i < label.length; i++) {
      index = index * 26 + (label.charCodeAt(i) - 65 + 1);
    }
    return index - 1;
  };

  // Helper function to parse cell address into column and row
  const parseCellAddress = (address: string): { col: number; row: number } | null => {
    const match = address.match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;
    
    const colLabel = match[1];
    const rowNum = parseInt(match[2], 10);
    
    return {
      col: getColumnIndex(colLabel),
      row: rowNum - 1
    };
  };

  // Navigate to adjacent cell using arrow keys
  const navigateCell = (direction: 'up' | 'down' | 'left' | 'right') => {
    // Only navigate if exactly one cell is selected
    const allSelected = [...selectedCells, ...temporarySelectedCells];
    if (allSelected.length !== 1) return;

    const currentAddress = allSelected[0];
    const parsed = parseCellAddress(currentAddress);
    if (!parsed) return;

    let { col, row } = parsed;

    // Calculate next cell based on direction
    switch (direction) {
      case 'up':
        row = Math.max(0, row - 1);
        break;
      case 'down':
        row = Math.min(99, row + 1); // Max 100 rows
        break;
      case 'left':
        col = Math.max(0, col - 1);
        break;
      case 'right':
        col = Math.min(51, col + 1); // Max 52 columns (A-AZ)
        break;
    }

    // Generate new cell address
    const newAddress = `${getColumnLabel(col)}${row + 1}`;
    
    // Move selection to new cell (focus will be handled by the cell's useEffect)
    handleCellSelect(newAddress);
  };

  const handleCellSelect = (address: string) => {
    // Clear any permanent selections first (row/column selections)
    setSelectedCells([]);
    
    // Replace temporary selection with just the clicked cell (not toggle/accumulate)
    // This ensures each new click replaces the previous selection, matching drag behavior
    setTemporarySelectedCells([address]);
    
    // Start 5-second timer to clear temporary selection
    if (tempSelectionTimerRef.current) {
      clearTimeout(tempSelectionTimerRef.current);
    }
    
    tempSelectionTimerRef.current = setTimeout(() => {
      setTemporarySelectedCells([]);
    }, 5000);
  };

  const handleRowSelect = (rowIndex: number) => {
    const rowCells: string[] = [];
    for (let col = 0; col < 52; col++) {
      const colLabel = getColumnLabel(col);
      rowCells.push(`${colLabel}${rowIndex + 1}`);
    }
    
    // Use temporary selection with 5-second timer (same as cell/drag selection)
    setSelectedCells([]);
    setTemporarySelectedCells(rowCells);
    
    // Start 5-second timer to clear temporary selection
    if (tempSelectionTimerRef.current) {
      clearTimeout(tempSelectionTimerRef.current);
    }
    
    tempSelectionTimerRef.current = setTimeout(() => {
      setTemporarySelectedCells([]);
    }, 5000);
  };

  const handleColumnSelect = (colIndex: number) => {
    const colCells: string[] = [];
    const colLabel = getColumnLabel(colIndex);
    for (let row = 0; row < 100; row++) {
      colCells.push(`${colLabel}${row + 1}`);
    }
    
    // Use temporary selection with 5-second timer (same as cell/drag selection)
    setSelectedCells([]);
    setTemporarySelectedCells(colCells);
    
    // Start 5-second timer to clear temporary selection
    if (tempSelectionTimerRef.current) {
      clearTimeout(tempSelectionTimerRef.current);
    }
    
    tempSelectionTimerRef.current = setTimeout(() => {
      setTemporarySelectedCells([]);
    }, 5000);
  };

  const handleDragSelection = (addresses: string[]) => {
    // During drag, keep existing selected cells and add temporary ones
    // Don't clear selectedCells - this preserves the first selected cell
    setTemporarySelectedCells(addresses);
    
    if (tempSelectionTimerRef.current) {
      clearTimeout(tempSelectionTimerRef.current);
    }
    
    tempSelectionTimerRef.current = setTimeout(() => {
      setTemporarySelectedCells([]);
    }, 5000);
  };

  const handleMakePermanent = () => {
    if (temporarySelectedCells.length > 0) {
      setSelectedCells(temporarySelectedCells);
      setTemporarySelectedCells([]);
      if (tempSelectionTimerRef.current) {
        clearTimeout(tempSelectionTimerRef.current);
      }
    }
  };

  const handleCellChange = (address: string, value: string) => {
    const newData = new Map(cellData);
    const existing = newData.get(address) || { address, value: "" };
    newData.set(address, { ...existing, value });
    
    saveToHistory(newData);
    setCellData(newData);
    
    // Keep selection active while typing + 5 seconds after last activity
    // Reset timer on each keystroke
    if (tempSelectionTimerRef.current) {
      clearTimeout(tempSelectionTimerRef.current);
    }
    
    // Set new 5-second timer to clear selection after inactivity
    tempSelectionTimerRef.current = setTimeout(() => {
      setTemporarySelectedCells([]);
    }, 5000);
    
    // Auto-resize column width horizontally (up to 4cm / ~150px max)
    const match = address.match(/^([A-Z]+)(\d+)$/);
    if (match) {
      const colLabel = match[1];
      
      // Calculate column index
      let colIndex = 0;
      for (let i = 0; i < colLabel.length; i++) {
        colIndex = colIndex * 26 + (colLabel.charCodeAt(i) - 65 + 1);
      }
      colIndex = colIndex - 1;
      
      // Get actual font size for the cell
      const cellFontSize = existing.fontSize ?? defaultFormatting.fontSize ?? 13;
      const cellFontFamily = existing.fontFamily ?? defaultFormatting.fontFamily ?? 'Arial';
      const cellFontWeight = existing.fontWeight ?? defaultFormatting.fontWeight ?? 'normal';
      
      // Measure text width
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        context.font = `${cellFontWeight} ${cellFontSize}px ${cellFontFamily}`;
        const textWidth = context.measureText(value).width;
        
        // Add padding (px-1 = 4px on each side = 8px total, plus buffer)
        const requiredWidth = textWidth + 16;
        const maxWidth = 150; // 4 cm maximum (after this, text wraps)
        const minWidth = 100; // Default column width (Google Sheets)
        const currentWidth = columnWidths.get(colIndex) || minWidth;
        
        // Only increase width up to maxWidth, never decrease
        if (requiredWidth > currentWidth && requiredWidth <= maxWidth) {
          setColumnWidths(prev => {
            const newMap = new Map(prev);
            newMap.set(colIndex, requiredWidth);
            return newMap;
          });
        } else if (currentWidth < maxWidth && requiredWidth > maxWidth) {
          // Set to max width if text requires more
          setColumnWidths(prev => {
            const newMap = new Map(prev);
            newMap.set(colIndex, maxWidth);
            return newMap;
          });
        }
      }
    }
  };

  const handleAddressChange = (oldAddress: string, newAddress: string) => {
    setCellData((prev) => {
      const newData = new Map(prev);
      const existing = newData.get(oldAddress);
      if (existing) {
        newData.delete(oldAddress);
        newData.set(newAddress, { ...existing, address: newAddress });
      }
      return newData;
    });
    
    setSelectedCells((prev) =>
      prev.map((addr) => (addr === oldAddress ? newAddress : addr))
    );
  };

  const handlePaste = (
    startAddress: string, 
    data: string[][], 
    formatting?: Array<Array<{ 
      bold?: boolean; 
      italic?: boolean; 
      underline?: boolean;
      fontFamily?: string;
      fontSize?: number; // Now number (pt value)
      color?: string;
      backgroundColor?: string;
    }>>
  ) => {
    console.log('🔵 PASTE DEBUG - Starting paste at:', startAddress);
    console.log('🔵 PASTE DEBUG - Data dimensions:', data.length, 'rows x', data[0]?.length || 0, 'cols');
    console.log('🔵 PASTE DEBUG - Data preview:', data);
    
    // Parse starting cell address to get row and column
    const match = startAddress.match(/^([A-Z]+)(\d+)$/);
    if (!match) {
      console.log('❌ PASTE ERROR - Invalid address format:', startAddress);
      return;
    }
    
    const startColLabel = match[1];
    const startRow = parseInt(match[2]) - 1; // Convert to 0-indexed
    
    console.log('🔵 PASTE DEBUG - Parsed start column label:', startColLabel);
    console.log('🔵 PASTE DEBUG - Parsed start row (0-indexed):', startRow);
    
    // Calculate starting column index
    let startCol = 0;
    for (let i = 0; i < startColLabel.length; i++) {
      startCol = startCol * 26 + (startColLabel.charCodeAt(i) - 65 + 1);
    }
    startCol = startCol - 1; // Convert to 0-indexed
    
    console.log('🔵 PASTE DEBUG - Calculated start column (0-indexed):', startCol);
    console.log('🔵 PASTE DEBUG - Expected: A=0, B=1, C=2...');
    
    // Create new cell data map
    const newData = new Map(cellData);
    
    // Distribute data across cells
    data.forEach((row, rowOffset) => {
      row.forEach((value, colOffset) => {
        const targetRow = startRow + rowOffset;
        const targetCol = startCol + colOffset;
        
        // Check bounds (100 rows, 52 columns = AZ)
        if (targetRow >= 100 || targetCol >= 52) {
          console.log(`⚠️ PASTE WARNING - Cell out of bounds: row=${targetRow}, col=${targetCol}, value="${value}"`);
          return;
        }
        
        // Generate target cell address
        const targetAddress = `${getColumnLabel(targetCol)}${targetRow + 1}`;
        
        // Debug first few cells
        if (rowOffset < 3 && colOffset < 3) {
          console.log(`🔵 PASTE DEBUG - Cell [${rowOffset},${colOffset}]: "${value}" → ${targetAddress} (row=${targetRow}, col=${targetCol})`);
        }
        
        // Get existing cell data or create new
        const existing = newData.get(targetAddress) || { address: targetAddress, value: "" };
        
        // Get formatting for this cell if available
        const cellFormatting = formatting?.[rowOffset]?.[colOffset];
        
        // Build text decoration string
        let textDecoration = existing.textDecoration || '';
        if (cellFormatting?.underline) {
          textDecoration = 'underline';
        }
        
        // Update cell with pasted value and ALL formatting (fontSize is now in pt)
        newData.set(targetAddress, {
          ...existing,
          value: value,
          // Text style formatting
          ...(cellFormatting?.bold && { fontWeight: 'bold' }),
          ...(cellFormatting?.italic && { fontStyle: 'italic' }),
          ...(cellFormatting?.underline && { textDecoration }),
          // Font formatting (fontSize is now a number in pt)
          ...(cellFormatting?.fontFamily && { fontFamily: cellFormatting.fontFamily }),
          ...(cellFormatting?.fontSize !== undefined && { fontSize: cellFormatting.fontSize }),
          // Color formatting
          ...(cellFormatting?.color && { color: cellFormatting.color }),
          ...(cellFormatting?.backgroundColor && { backgroundColor: cellFormatting.backgroundColor }),
        });
      });
    });
    
    // Save to history and update cell data
    saveToHistory(newData);
    setCellData(newData);
    
    // Show success message
    const rowCount = data.length;
    const colCount = data[0]?.length || 0;
    const hasFormatting = formatting && formatting.length > 0;
    toast({
      title: "Data pasted successfully",
      description: `Pasted ${rowCount} row(s) × ${colCount} column(s) starting from ${startAddress}${hasFormatting ? ' with full formatting' : ''}`,
    });
  };

  const handleTextColorApply = (color: string) => {
    const allSelected = [...selectedCells, ...temporarySelectedCells];
    
    // If no cells selected, show message to select cells first
    if (allSelected.length === 0) {
      toast({
        title: "No cells selected",
        description: "Please select cells before applying text color",
        variant: "destructive",
      });
      return;
    }
    
    // Apply to selected cells only
    const newData = new Map(cellData);
    allSelected.forEach((address) => {
      const existing = newData.get(address) || { address, value: "" };
      newData.set(address, {
        ...existing,
        color: color,
      });
    });
    
    saveToHistory(newData);
    setCellData(newData);
    
    if (!retainSelection) {
      setSelectedCells([]);
      setTemporarySelectedCells([]);
      if (tempSelectionTimerRef.current) {
        clearTimeout(tempSelectionTimerRef.current);
      }
    }
  };

  const handleColorApply = (color: string) => {
    const allSelected = [...selectedCells, ...temporarySelectedCells];
    
    // If no cells selected, show message to select cells first
    if (allSelected.length === 0) {
      toast({
        title: "No cells selected",
        description: "Please select cells before applying color",
        variant: "destructive",
      });
      return;
    }
    
    // Apply to selected cells only
    const newData = new Map(cellData);
    allSelected.forEach((address) => {
      const existing = newData.get(address) || { address, value: "" };
      newData.set(address, {
        ...existing,
        backgroundColor: color === "transparent" ? undefined : color,
      });
    });
    
    saveToHistory(newData);
    setCellData(newData);
    
    if (!retainSelection) {
      setSelectedCells([]);
      setTemporarySelectedCells([]);
      if (tempSelectionTimerRef.current) {
        clearTimeout(tempSelectionTimerRef.current);
      }
    }
  };

  const handleBorderChange = (type: string, color: string) => {
    const allSelected = [...selectedCells, ...temporarySelectedCells];
    
    // If no cells selected, show message to select cells first
    if (allSelected.length === 0) {
      toast({
        title: "No cells selected",
        description: "Please select cells before applying borders",
        variant: "destructive",
      });
      return;
    }
    
    const borderStyle = `1px solid ${color}`;
    const newData = new Map(cellData);
    
    // Helper to get min/max row and col from selected cells
    const getSelectionBounds = () => {
      const rows = allSelected.map(addr => {
        const match = addr.match(/[A-Z]+(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
      const cols = allSelected.map(addr => {
        const match = addr.match(/([A-Z]+)\d+/);
        if (!match) return 0;
        let col = 0;
        for (let i = 0; i < match[1].length; i++) {
          col = col * 26 + (match[1].charCodeAt(i) - 64);
        }
        return col;
      });
      return {
        minRow: Math.min(...rows),
        maxRow: Math.max(...rows),
        minCol: Math.min(...cols),
        maxCol: Math.max(...cols),
      };
    };

    const bounds = getSelectionBounds();
    
    allSelected.forEach((address) => {
      const existing = newData.get(address) || { address, value: "" };
      const match = address.match(/([A-Z]+)(\d+)/);
      if (!match) return;
      
      const colStr = match[1];
      let col = 0;
      for (let i = 0; i < colStr.length; i++) {
        col = col * 26 + (colStr.charCodeAt(i) - 64);
      }
      const row = parseInt(match[2]);
      
      let updates: Partial<CellData> = {};
      
      switch (type) {
        case 'all':
          updates = {
            borderTop: borderStyle,
            borderRight: borderStyle,
            borderBottom: borderStyle,
            borderLeft: borderStyle,
          };
          break;
        case 'outer':
          if (row === bounds.minRow) updates.borderTop = borderStyle;
          if (row === bounds.maxRow) updates.borderBottom = borderStyle;
          if (col === bounds.minCol) updates.borderLeft = borderStyle;
          if (col === bounds.maxCol) updates.borderRight = borderStyle;
          break;
        case 'inner':
          if (row !== bounds.minRow) updates.borderTop = borderStyle;
          if (row !== bounds.maxRow) updates.borderBottom = borderStyle;
          if (col !== bounds.minCol) updates.borderLeft = borderStyle;
          if (col !== bounds.maxCol) updates.borderRight = borderStyle;
          break;
        case 'horizontal':
          updates = {
            borderTop: borderStyle,
            borderBottom: borderStyle,
          };
          break;
        case 'vertical':
          updates = {
            borderLeft: borderStyle,
            borderRight: borderStyle,
          };
          break;
        case 'top':
          updates.borderTop = borderStyle;
          break;
        case 'bottom':
          updates.borderBottom = borderStyle;
          break;
        case 'left':
          updates.borderLeft = borderStyle;
          break;
        case 'right':
          updates.borderRight = borderStyle;
          break;
        case 'clear':
          updates = {
            borderTop: undefined,
            borderRight: undefined,
            borderBottom: undefined,
            borderLeft: undefined,
          };
          break;
      }
      
      newData.set(address, { ...existing, ...updates });
    });
    
    saveToHistory(newData);
    setCellData(newData);
    
    // Convert temporary selections to permanent when formatting
    if (temporarySelectedCells.length > 0) {
      setSelectedCells(Array.from(new Set([...selectedCells, ...temporarySelectedCells])));
      setTemporarySelectedCells([]);
      if (tempSelectionTimerRef.current) {
        clearTimeout(tempSelectionTimerRef.current);
      }
    }
  };

  const handleFontSizeChange = (size: number) => {
    const allSelected = [...selectedCells, ...temporarySelectedCells];
    
    // If no cells selected, apply to ALL cells (update global default)
    if (allSelected.length === 0) {
      setDefaultFormatting(prev => ({
        ...prev,
        fontSize: size,
      }));
      return;
    }
    
    // Apply to selected cells only
    const newData = new Map(cellData);
    allSelected.forEach((address) => {
      const existing = newData.get(address) || { address, value: "" };
      newData.set(address, { ...existing, fontSize: size });
    });
    
    saveToHistory(newData);
    setCellData(newData);
    
    // Convert temporary selections to permanent when formatting
    if (temporarySelectedCells.length > 0) {
      setSelectedCells(Array.from(new Set([...selectedCells, ...temporarySelectedCells])));
      setTemporarySelectedCells([]);
      if (tempSelectionTimerRef.current) {
        clearTimeout(tempSelectionTimerRef.current);
      }
    }
  };

  const handleFontWeightChange = (weight: string) => {
    const allSelected = [...selectedCells, ...temporarySelectedCells];
    
    // If no cells selected, show message to select cells first
    if (allSelected.length === 0) {
      toast({
        title: "No cells selected",
        description: "Please select cells before applying bold",
        variant: "destructive",
      });
      return;
    }
    
    // Apply to selected cells only
    const newData = new Map(cellData);
    allSelected.forEach((address) => {
      const existing = newData.get(address) || { address, value: "" };
      newData.set(address, { ...existing, fontWeight: weight });
    });
    
    saveToHistory(newData);
    setCellData(newData);
    
    // Convert temporary selections to permanent when formatting
    if (temporarySelectedCells.length > 0) {
      setSelectedCells(Array.from(new Set([...selectedCells, ...temporarySelectedCells])));
      setTemporarySelectedCells([]);
      if (tempSelectionTimerRef.current) {
        clearTimeout(tempSelectionTimerRef.current);
      }
    }
  };

  const handleFontFamilyChange = (family: string) => {
    const allSelected = [...selectedCells, ...temporarySelectedCells];
    
    // If no cells selected, apply to ALL cells (update global default)
    if (allSelected.length === 0) {
      setDefaultFormatting(prev => ({
        ...prev,
        fontFamily: family,
      }));
      return;
    }
    
    // Apply to selected cells only
    const newData = new Map(cellData);
    allSelected.forEach((address) => {
      const existing = newData.get(address) || { address, value: "" };
      newData.set(address, { ...existing, fontFamily: family });
    });
    
    saveToHistory(newData);
    setCellData(newData);
    
    // Convert temporary selections to permanent when formatting
    if (temporarySelectedCells.length > 0) {
      setSelectedCells(Array.from(new Set([...selectedCells, ...temporarySelectedCells])));
      setTemporarySelectedCells([]);
      if (tempSelectionTimerRef.current) {
        clearTimeout(tempSelectionTimerRef.current);
      }
    }
  };

  const handleItalicToggle = () => {
    const allSelected = [...selectedCells, ...temporarySelectedCells];
    
    // If no cells selected, show message to select cells first
    if (allSelected.length === 0) {
      toast({
        title: "No cells selected",
        description: "Please select cells before applying italic",
        variant: "destructive",
      });
      return;
    }
    
    // Apply to selected cells only
    const newData = new Map(cellData);
    allSelected.forEach((address) => {
      const existing = newData.get(address) || { address, value: "" };
      const currentStyle = existing.fontStyle || "normal";
      newData.set(address, { 
        ...existing, 
        fontStyle: currentStyle === "italic" ? "normal" : "italic" 
      });
    });
    
    saveToHistory(newData);
    setCellData(newData);
    
    // Convert temporary selections to permanent when formatting
    if (temporarySelectedCells.length > 0) {
      setSelectedCells(Array.from(new Set([...selectedCells, ...temporarySelectedCells])));
      setTemporarySelectedCells([]);
      if (tempSelectionTimerRef.current) {
        clearTimeout(tempSelectionTimerRef.current);
      }
    }
  };

  const handleUnderlineToggle = () => {
    const allSelected = [...selectedCells, ...temporarySelectedCells];
    
    // If no cells selected, show message to select cells first
    if (allSelected.length === 0) {
      toast({
        title: "No cells selected",
        description: "Please select cells before applying underline",
        variant: "destructive",
      });
      return;
    }
    
    // Apply to selected cells only
    const newData = new Map(cellData);
    allSelected.forEach((address) => {
      const existing = newData.get(address) || { address, value: "" };
      const currentDecoration = existing.textDecoration || "none";
      newData.set(address, { 
        ...existing, 
        textDecoration: currentDecoration === "underline" ? "none" : "underline" 
      });
    });
    
    saveToHistory(newData);
    setCellData(newData);
    
    // Convert temporary selections to permanent when formatting
    if (temporarySelectedCells.length > 0) {
      setSelectedCells(Array.from(new Set([...selectedCells, ...temporarySelectedCells])));
      setTemporarySelectedCells([]);
      if (tempSelectionTimerRef.current) {
        clearTimeout(tempSelectionTimerRef.current);
      }
    }
  };

  const handleShowInput = () => {
    const allSelected = [...selectedCells, ...temporarySelectedCells];
    const values = allSelected.map((addr) => cellData.get(addr)?.value || "").join(", ");
    setInputValue(values);
  };

  const handleShowOutput = () => {
    const allSelected = [...selectedCells, ...temporarySelectedCells];
    const addresses = allSelected.join(", ");
    setOutputValue(addresses);
  };

  const handleFormulaApply = (formula: string) => {
    const allSelected = [...selectedCells, ...temporarySelectedCells];
    if (allSelected.length === 0) return;

    const values = allSelected
      .map((addr) => parseFloat(cellData.get(addr)?.value || "0"))
      .filter((v) => !isNaN(v));

    let result: any = 0;
    
    const customFormula = customFormulas.find((f) => f.name === formula);
    if (customFormula) {
      try {
        const formulaFunction = new Function("values", `return ${customFormula.logic}`);
        result = formulaFunction(values);
      } catch (error) {
        setOutputValue(`Error in ${formula}: Invalid formula`);
        return;
      }
    } else {
      switch (formula) {
        case "SUM":
          result = values.reduce((a, b) => a + b, 0);
          break;
        case "AVERAGE":
          result = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case "COUNT":
          result = values.length;
          break;
        case "MIN":
          result = Math.min(...values);
          break;
        case "MAX":
          result = Math.max(...values);
          break;
        case "MULTIPLY":
          result = values.reduce((a, b) => a * b, 1);
          break;
      }
    }

    setOutputValue(`${formula}: ${result}`);
  };

  const handleAddCustomFormula = (name: string, logic: string) => {
    setCustomFormulas((prev) => [...prev, { name, logic }]);
  };

  const handleBulkAdd = (values: string[], separator: string) => {
    const allSelected = [...selectedCells, ...temporarySelectedCells];
    if (allSelected.length === 0) return;

    const newData = new Map(cellData);
    allSelected.forEach((address, index) => {
      if (index < values.length) {
        const existing = newData.get(address) || { address, value: "" };
        newData.set(address, { ...existing, value: values[index] });
      }
    });
    
    saveToHistory(newData);
    setCellData(newData);
  };

  const handleSelectAll = () => {
    if (temporarySelectedCells.length > 0) {
      setSelectedCells(temporarySelectedCells);
      setTemporarySelectedCells([]);
      if (tempSelectionTimerRef.current) {
        clearTimeout(tempSelectionTimerRef.current);
      }
    } else if (selectedCells.length > 0) {
      setSelectedCells([]);
    }
  };

  const handleLockToggle = () => {
    if (temporarySelectedCells.length > 0) {
      setSelectedCells(temporarySelectedCells);
      setTemporarySelectedCells([]);
      if (tempSelectionTimerRef.current) {
        clearTimeout(tempSelectionTimerRef.current);
      }
      setRetainSelection(true);
    } else {
      setRetainSelection(!retainSelection);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCellData(new Map(history[historyIndex - 1].cellData));
      setMergedCells([...history[historyIndex - 1].mergedCells]);
      setColumnWidths(new Map(history[historyIndex - 1].columnWidths));
      setRowHeights(new Map(history[historyIndex - 1].rowHeights));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCellData(new Map(history[historyIndex + 1].cellData));
      setMergedCells([...history[historyIndex + 1].mergedCells]);
      setColumnWidths(new Map(history[historyIndex + 1].columnWidths));
      setRowHeights(new Map(history[historyIndex + 1].rowHeights));
    }
  };

  const handleMergeCells = (type: 'all' | 'vertical' | 'horizontal' = 'all') => {
    // Combine both selected and temporary selected cells
    const allSelected = [...selectedCells, ...temporarySelectedCells];
    
    if (allSelected.length < 2) {
      toast({
        title: "No cells selected",
        description: "Please select at least 2 cells to merge",
        variant: "destructive",
      });
      return;
    }

    if (allSelected.length > 100) {
      toast({
        title: "Too Many Cells Selected",
        description: `You selected ${allSelected.length} cells. Please select 100 or fewer cells to merge.`,
        variant: "destructive",
      });
      return;
    }

    const getCellRowCol = (addr: string) => {
      const match = addr.match(/^([A-Z]+)(\d+)$/);
      if (!match) return { row: 0, col: 0 };
      const colLabel = match[1];
      const row = parseInt(match[2]) - 1;
      let col = 0;
      for (let i = 0; i < colLabel.length; i++) {
        col = col * 26 + (colLabel.charCodeAt(i) - 65 + 1);
      }
      return { row, col: col - 1 };
    };

    const cells = allSelected.map(addr => ({ addr, ...getCellRowCol(addr) }));
    let minRow = Math.min(...cells.map(c => c.row));
    let maxRow = Math.max(...cells.map(c => c.row));
    let minCol = Math.min(...cells.map(c => c.col));
    let maxCol = Math.max(...cells.map(c => c.col));

    // Adjust range based on merge type
    if (type === 'vertical') {
      // Keep all rows, but use only the first column
      maxCol = minCol;
    } else if (type === 'horizontal') {
      // Keep all columns, but use only the first row
      maxRow = minRow;
    }

    const startAddress = `${getColumnLabel(minCol)}${minRow + 1}`;
    const endAddress = `${getColumnLabel(maxCol)}${maxRow + 1}`;
    const colspan = maxCol - minCol + 1;
    const rowspan = maxRow - minRow + 1;

    const originalCells = new Map<string, CellData>();
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const addr = `${getColumnLabel(col)}${row + 1}`;
        const existing = cellData.get(addr);
        if (existing) {
          originalCells.set(addr, { ...existing });
        } else {
          originalCells.set(addr, {
            address: addr,
            value: "",
          });
        }
      }
    }

    const values = allSelected
      .map((addr) => cellData.get(addr)?.value || "")
      .filter((val) => val !== "")
      .join(" ");

    const newData = new Map(cellData);
    
    allSelected.forEach((addr) => {
      if (addr !== startAddress) {
        newData.delete(addr);
      }
    });
    
    const startCell = cellData.get(startAddress);
    newData.set(startAddress, { 
      address: startAddress,
      value: values,
      backgroundColor: startCell?.backgroundColor,
      fontSize: startCell?.fontSize,
      fontWeight: startCell?.fontWeight,
      fontFamily: startCell?.fontFamily,
      fontStyle: startCell?.fontStyle,
      textDecoration: startCell?.textDecoration,
    });
    
    const newMergedCells = [...mergedCells, { startAddress, endAddress, colspan, rowspan, originalCells }];
    
    saveToHistory(newData, newMergedCells);
    setCellData(newData);
    setMergedCells(newMergedCells);
    
    // Set the merged cell as selected (permanent selection)
    setSelectedCells([startAddress]);
    setTemporarySelectedCells([]);
    if (tempSelectionTimerRef.current) {
      clearTimeout(tempSelectionTimerRef.current);
    }
  };

  const handleUnmergeCells = () => {
    // Combine both selected and temporary selected cells
    const allSelected = [...selectedCells, ...temporarySelectedCells];
    
    if (allSelected.length !== 1) {
      toast({
        title: "No cell selected",
        description: "Please select exactly one merged cell to unmerge",
        variant: "destructive",
      });
      return;
    }
    
    const selectedAddress = allSelected[0];
    const mergedCell = mergedCells.find(m => m.startAddress === selectedAddress);
    
    if (!mergedCell) {
      toast({
        title: "Not a merged cell",
        description: "The selected cell is not merged",
        variant: "destructive",
      });
      return;
    }

    const getCellRowCol = (addr: string) => {
      const match = addr.match(/^([A-Z]+)(\d+)$/);
      if (!match) return { row: 0, col: 0 };
      const colLabel = match[1];
      const row = parseInt(match[2]) - 1;
      let col = 0;
      for (let i = 0; i < colLabel.length; i++) {
        col = col * 26 + (colLabel.charCodeAt(i) - 65 + 1);
      }
      return { row, col: col - 1 };
    };

    const start = getCellRowCol(mergedCell.startAddress);
    const newData = new Map(cellData);
    const allCellsInMerge: string[] = [];
    
    for (let row = start.row; row < start.row + mergedCell.rowspan; row++) {
      for (let col = start.col; col < start.col + mergedCell.colspan; col++) {
        const addr = `${getColumnLabel(col)}${row + 1}`;
        allCellsInMerge.push(addr);
        
        if (mergedCell.originalCells && mergedCell.originalCells.has(addr)) {
          const originalCell = mergedCell.originalCells.get(addr);
          if (originalCell) {
            newData.set(addr, { ...originalCell });
          }
        } else {
          newData.set(addr, {
            address: addr,
            value: "",
          });
        }
      }
    }
    
    const newMergedCells = mergedCells.filter(m => m.startAddress !== selectedAddress);
    
    saveToHistory(newData, newMergedCells);
    setCellData(newData);
    setMergedCells(newMergedCells);
    
    // Set the unmerged cells as selected (permanent selection)
    setSelectedCells(allCellsInMerge);
    setTemporarySelectedCells([]);
    if (tempSelectionTimerRef.current) {
      clearTimeout(tempSelectionTimerRef.current);
    }
  };

  // Helper function to measure text width using canvas
  const measureTextWidth = (text: string, fontFamily: string, fontSize: number, fontWeight: string, fontStyle: string): number => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return 0;
    
    context.font = `${fontStyle} ${fontWeight} ${fontSize}pt ${fontFamily}`;
    return context.measureText(text).width;
  };

  // Helper function to calculate required height for text with word wrapping
  const calculateRequiredHeight = (
    text: string, 
    columnWidth: number, 
    fontFamily: string, 
    fontSize: number,
    fontWeight: string,
    fontStyle: string
  ): number => {
    if (!text) return 21; // Default height for empty cells
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return 21;
    
    context.font = `${fontStyle} ${fontWeight} ${fontSize}pt ${fontFamily}`;
    
    // Account for cell padding (px-1 = 4px each side = 8px total)
    const availableWidth = columnWidth - 8;
    
    // Convert fontSize from pt to px: 1pt = 4/3 px (or 1.333px)
    const fontSizePx = fontSize * (4/3);
    // lineHeight in CSS is set to fontSize * 1.1 (in pt), convert to px
    const lineHeightPx = fontSizePx * 1.1;
    
    // Split by manual line breaks first
    const lines = text.split('\n');
    let totalLines = 0;
    
    for (const line of lines) {
      if (!line) {
        totalLines += 1; // Empty line still counts
        continue;
      }
      
      // Check if line fits in available width
      const lineWidth = context.measureText(line).width;
      if (lineWidth <= availableWidth) {
        totalLines += 1;
      } else {
        // Need to wrap - split into words
        const words = line.split(' ');
        let currentLine = '';
        let wrappedLines = 0;
        
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = context.measureText(testLine).width;
          
          if (testWidth <= availableWidth) {
            currentLine = testLine;
          } else {
            // Check if single word is too long (needs character breaking)
            const wordWidth = context.measureText(word).width;
            if (wordWidth > availableWidth) {
              // Word itself is too long, break by characters
              if (currentLine) {
                wrappedLines += 1;
                currentLine = '';
              }
              
              let charLine = '';
              for (const char of word) {
                const testCharLine = charLine + char;
                const testCharWidth = context.measureText(testCharLine).width;
                if (testCharWidth <= availableWidth) {
                  charLine = testCharLine;
                } else {
                  wrappedLines += 1;
                  charLine = char;
                }
              }
              currentLine = charLine;
            } else {
              // Start new line with current word
              if (currentLine) wrappedLines += 1;
              currentLine = word;
            }
          }
        }
        if (currentLine) wrappedLines += 1;
        totalLines += wrappedLines;
      }
    }
    
    // If single line, return default height (no adjustment needed)
    if (totalLines === 1) {
      return 21; // Default row height for single line text
    }
    
    // Calculate total height for multi-line text: lines * lineHeight(px) + minimal spacing
    // No padding on textarea, but need buffer for last line when text wraps
    const contentHeight = Math.ceil(totalLines * lineHeightPx);
    // Add 8px buffer: 2px for textarea offset + 6px for wrapped text last line
    const requiredHeight = contentHeight + 8;
    return Math.max(21, requiredHeight); // Minimum 21px
  };

  // Auto Adjust function - adjusts all column widths and row heights based on content
  const handleAutoAdjust = () => {
    const rows = 100;
    const cols = 52;
    
    // Maps to store new dimensions
    const newColumnWidths = new Map<number, number>();
    const newRowHeights = new Map<number, number>();
    
    // Track which columns and rows have content
    const columnsWithContent = new Set<number>();
    const rowsWithContent = new Set<number>();
    
    // First pass: identify cells with content and calculate requirements
    const columnRequirements = new Map<number, number>(); // col -> max width needed
    
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      for (let colIndex = 0; colIndex < cols; colIndex++) {
        const address = `${getColumnLabel(colIndex)}${rowIndex + 1}`;
        const cell = cellData.get(address);
        
        if (cell && cell.value) {
          columnsWithContent.add(colIndex);
          rowsWithContent.add(rowIndex);
          
          const fontFamily = cell.fontFamily || 'Arial';
          const fontSize = cell.fontSize || 11;
          const fontWeight = cell.fontWeight || 'normal';
          const fontStyle = cell.fontStyle || 'normal';
          
          // Measure required width
          const lines = cell.value.split('\n');
          let maxLineWidth = 0;
          
          for (const line of lines) {
            const lineWidth = measureTextWidth(line, fontFamily, fontSize, fontWeight, fontStyle);
            maxLineWidth = Math.max(maxLineWidth, lineWidth);
          }
          
          // Add padding (px-1 = 4px each side = 8px total)
          let requiredWidth = maxLineWidth + 8;
          
          // Apply width limits with word break prevention
          if (requiredWidth > 150 && requiredWidth <= 160) {
            // Check if we can avoid word break by extending to 160px
            // For simplicity, if it's close (150-160), allow it
            requiredWidth = Math.min(requiredWidth, 160);
          } else if (requiredWidth > 160) {
            // Too wide, cap at 150px
            requiredWidth = 150;
          } else if (requiredWidth < 100) {
            // Below default, use default
            requiredWidth = 100;
          }
          
          // Update column requirement (take maximum)
          const currentMax = columnRequirements.get(colIndex) || 100;
          columnRequirements.set(colIndex, Math.max(currentMax, requiredWidth));
        }
      }
    }
    
    // Set column widths
    for (let colIndex = 0; colIndex < cols; colIndex++) {
      if (columnsWithContent.has(colIndex)) {
        const width = columnRequirements.get(colIndex) || 100;
        newColumnWidths.set(colIndex, width);
      } else {
        // No content - reset to default
        newColumnWidths.set(colIndex, 100);
      }
    }
    
    // Second pass: calculate row heights based on new column widths
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      let maxHeightInRow = 21; // Default
      
      if (rowsWithContent.has(rowIndex)) {
        for (let colIndex = 0; colIndex < cols; colIndex++) {
          const address = `${getColumnLabel(colIndex)}${rowIndex + 1}`;
          const cell = cellData.get(address);
          
          if (cell && cell.value) {
            const fontFamily = cell.fontFamily || 'Arial';
            const fontSize = cell.fontSize || 11;
            const fontWeight = cell.fontWeight || 'normal';
            const fontStyle = cell.fontStyle || 'normal';
            const columnWidth = newColumnWidths.get(colIndex) || 100;
            
            const requiredHeight = calculateRequiredHeight(
              cell.value,
              columnWidth,
              fontFamily,
              fontSize,
              fontWeight,
              fontStyle
            );
            
            maxHeightInRow = Math.max(maxHeightInRow, requiredHeight);
          }
        }
      }
      
      newRowHeights.set(rowIndex, maxHeightInRow);
    }
    
    // Save to history before applying
    saveToHistory(cellData, mergedCells, newColumnWidths, newRowHeights);
    
    // Apply new dimensions
    setColumnWidths(newColumnWidths);
    setRowHeights(newRowHeights);
    
    // Show success toast
    toast({
      title: "Auto-adjusted successfully",
      description: "Grid has been automatically adjusted based on content",
    });
  };

  const handleDownloadClick = () => {
    // Open dialog with current spreadsheet name
    setDownloadFileName(spreadsheetName);
    setShowDownloadDialog(true);
  };

  const handleDownload = async () => {
    // Close dialog first
    setShowDownloadDialog(false);
    
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      
      // Export all sheets
      for (const sheet of sheets) {
        const worksheet = workbook.addWorksheet(sheet.name);
        
        // Find filled range (min/max rows and columns with data)
        let minRow = 100, maxRow = 0, minCol = 52, maxCol = 0;
        let hasData = false;
        
        sheet.cellData.forEach((cell, address) => {
          if (cell.value && cell.value.trim()) {
            hasData = true;
            const match = address.match(/^([A-Z]+)(\d+)$/);
            if (match) {
              const colIndex = getColumnIndex(match[1]);
              const rowIndex = parseInt(match[2]) - 1;
              minRow = Math.min(minRow, rowIndex);
              maxRow = Math.max(maxRow, rowIndex);
              minCol = Math.min(minCol, colIndex);
              maxCol = Math.max(maxCol, colIndex);
            }
          }
        });
        
        // If no data, export at least first cell
        if (!hasData) {
          minRow = 0;
          maxRow = 0;
          minCol = 0;
          maxCol = 0;
        }
        
        const rows = maxRow + 1;
        const cols = maxCol + 1;
        
        // Set column widths
        for (let colIndex = 0; colIndex < cols; colIndex++) {
          const width = sheet.columnWidths.get(colIndex) || 100;
          worksheet.getColumn(colIndex + 1).width = width / 7.6;
        }
        
        // Set row heights and cell data
        for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
          const row = worksheet.getRow(rowIndex + 1);
          const webHeight = sheet.rowHeights.get(rowIndex) || 10.5;
          const excelHeight = webHeight < 15 ? 21 : webHeight;
          row.height = excelHeight * 0.75;
          
          for (let colIndex = 0; colIndex < cols; colIndex++) {
            const address = `${getColumnLabel(colIndex)}${rowIndex + 1}`;
            const cellData_item = sheet.cellData.get(address);
            
            if (cellData_item) {
              const excelCell = row.getCell(colIndex + 1);
              excelCell.value = cellData_item.value || "";
              
              const fontFamily = cellData_item.fontFamily || 'Arial';
              const fontSize = cellData_item.fontSize || 11;
              const fontWeight = cellData_item.fontWeight || 'normal';
              const fontStyle = cellData_item.fontStyle || 'normal';
              const textDecoration = cellData_item.textDecoration || 'none';
              
              excelCell.font = {
                name: fontFamily,
                size: fontSize,
                bold: fontWeight === 'bold',
                italic: fontStyle === 'italic',
                underline: textDecoration === 'underline' ? true : false,
              };
              
              if (cellData_item.backgroundColor) {
                const color = cellData_item.backgroundColor.replace('#', '');
                excelCell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FF' + color },
                };
              }
              
              excelCell.border = {
                top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
              };
              
              excelCell.alignment = {
                wrapText: true,
                vertical: 'top',
                horizontal: 'left',
              };
            }
          }
        }
        
        // Apply merged cells
        sheet.mergedCells.forEach(merge => {
          const startMatch = merge.startAddress.match(/^([A-Z]+)(\d+)$/);
          const endMatch = merge.endAddress.match(/^([A-Z]+)(\d+)$/);
          
          if (startMatch && endMatch) {
            const startCol = startMatch[1];
            const startRow = parseInt(startMatch[2]);
            const endCol = endMatch[1];
            const endRow = parseInt(endMatch[2]);
            
            worksheet.mergeCells(`${startCol}${startRow}:${endCol}${endRow}`);
          }
        });
      }
      
      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
      });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${downloadFileName || spreadsheetName}.xlsx`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast({
        title: "Downloaded Successfully",
        description: `${downloadFileName || spreadsheetName}.xlsx has been downloaded with all formatting preserved.`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleModeToggle = () => {
    setIsComplexMode((prev) => !prev);
    toast({
      title: isComplexMode ? "Switched to Simple Mode" : "Switched to Complex Mode",
      description: isComplexMode 
        ? "Basic features are now active" 
        : "Advanced features are now available",
    });
  };

  const handleDeleteRow = (rowIndex: number) => {
    const newCellData = new Map(cellData);
    const newMergedCells = mergedCells.filter(m => {
      const startRow = parseInt(m.startAddress.match(/\d+/)?.[0] || '0') - 1;
      return startRow !== rowIndex;
    });
    
    for (let col = 0; col < 52; col++) {
      const address = `${getColumnLabel(col)}${rowIndex + 1}`;
      newCellData.delete(address);
    }
    
    const updatedCellData = new Map<string, CellData>();
    newCellData.forEach((data, address) => {
      const match = address.match(/([A-Z]+)(\d+)/);
      if (match) {
        const col = match[1];
        const row = parseInt(match[2]);
        if (row > rowIndex + 1) {
          const newAddress = `${col}${row - 1}`;
          updatedCellData.set(newAddress, { ...data, address: newAddress });
        } else {
          updatedCellData.set(address, data);
        }
      }
    });
    
    setCellData(updatedCellData);
    setMergedCells(newMergedCells);
    saveToHistory(updatedCellData, newMergedCells);
    setSelectedCells([]);
  };

  const handleInsertRow = (rowIndex: number) => {
    const newCellData = new Map<string, CellData>();
    
    cellData.forEach((data, address) => {
      const match = address.match(/([A-Z]+)(\d+)/);
      if (match) {
        const col = match[1];
        const row = parseInt(match[2]);
        if (row >= rowIndex + 1) {
          const newAddress = `${col}${row + 1}`;
          newCellData.set(newAddress, { ...data, address: newAddress });
        } else {
          newCellData.set(address, data);
        }
      }
    });
    
    setCellData(newCellData);
    saveToHistory(newCellData);
  };

  const handleDeleteColumn = (colIndex: number) => {
    const colLabel = getColumnLabel(colIndex);
    const newCellData = new Map(cellData);
    const newMergedCells = mergedCells.filter(m => {
      const startCol = m.startAddress.match(/[A-Z]+/)?.[0];
      return startCol !== colLabel;
    });
    
    for (let row = 0; row < 100; row++) {
      const address = `${colLabel}${row + 1}`;
      newCellData.delete(address);
    }
    
    const updatedCellData = new Map<string, CellData>();
    const getColumnIndexFromLabel = (label: string): number => {
      let index = 0;
      for (let i = 0; i < label.length; i++) {
        index = index * 26 + (label.charCodeAt(i) - 65 + 1);
      }
      return index - 1;
    };
    
    newCellData.forEach((data, address) => {
      const match = address.match(/([A-Z]+)(\d+)/);
      if (match) {
        const col = match[1];
        const row = match[2];
        const currentColIndex = getColumnIndexFromLabel(col);
        if (currentColIndex > colIndex) {
          const newAddress = `${getColumnLabel(currentColIndex - 1)}${row}`;
          updatedCellData.set(newAddress, { ...data, address: newAddress });
        } else {
          updatedCellData.set(address, data);
        }
      }
    });
    
    setCellData(updatedCellData);
    setMergedCells(newMergedCells);
    saveToHistory(updatedCellData, newMergedCells);
    setSelectedCells([]);
  };

  const handleInsertColumn = (colIndex: number) => {
    const newCellData = new Map<string, CellData>();
    const getColumnIndexFromLabel = (label: string): number => {
      let index = 0;
      for (let i = 0; i < label.length; i++) {
        index = index * 26 + (label.charCodeAt(i) - 65 + 1);
      }
      return index - 1;
    };
    
    cellData.forEach((data, address) => {
      const match = address.match(/([A-Z]+)(\d+)/);
      if (match) {
        const col = match[1];
        const row = match[2];
        const currentColIndex = getColumnIndexFromLabel(col);
        if (currentColIndex >= colIndex) {
          const newAddress = `${getColumnLabel(currentColIndex + 1)}${row}`;
          newCellData.set(newAddress, { ...data, address: newAddress });
        } else {
          newCellData.set(address, data);
        }
      }
    });
    
    setCellData(newCellData);
    saveToHistory(newCellData);
  };

  useEffect(() => {
    return () => {
      if (tempSelectionTimerRef.current) {
        clearTimeout(tempSelectionTimerRef.current);
      }
    };
  }, []);

  // Keyboard navigation with arrow keys (Excel/Google Sheets style)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle arrow keys when not typing in an input field (except textarea which is handled by cell)
      if (event.target instanceof HTMLInputElement) {
        return;
      }

      // Check if an arrow key was pressed
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          navigateCell('up');
          break;
        case 'ArrowDown':
          event.preventDefault();
          navigateCell('down');
          break;
        case 'ArrowLeft':
          event.preventDefault();
          navigateCell('left');
          break;
        case 'ArrowRight':
          event.preventDefault();
          navigateCell('right');
          break;
      }
    };

    // Add event listener to document
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedCells, temporarySelectedCells]); // Re-run when selection changes

  // Check if the selected cell (either permanent or temporary) is a merged cell
  const allSelectedForMerge = [...selectedCells, ...temporarySelectedCells];
  const isMergedCell = allSelectedForMerge.length === 1 && mergedCells.some(m => m.startAddress === allSelectedForMerge[0]);
  
  const getFirstSelectedCell = () => {
    const firstCell = selectedCells[0] || temporarySelectedCells[0];
    return firstCell ? cellData.get(firstCell) : undefined;
  };
  
  const firstCell = getFirstSelectedCell();
  const currentFontSize = firstCell?.fontSize || defaultFormatting.fontSize || 11;
  const currentFontWeight = firstCell?.fontWeight || defaultFormatting.fontWeight || "normal";
  const currentFontFamily = firstCell?.fontFamily || defaultFormatting.fontFamily || "Arial";
  const currentFontStyle = firstCell?.fontStyle || defaultFormatting.fontStyle || "normal";
  const currentTextDecoration = firstCell?.textDecoration || defaultFormatting.textDecoration || "none";

  // Sheet management functions
  const handleAddSheet = () => {
    const newSheetNum = sheets.length + 1;
    const newSheet: Sheet = {
      id: `sheet-${Date.now()}`,
      name: `Sheet${newSheetNum}`,
      cellData: new Map(),
      mergedCells: [],
      columnWidths: new Map(),
      rowHeights: new Map(),
      history: [{ 
        cellData: new Map(), 
        mergedCells: [],
        columnWidths: new Map(),
        rowHeights: new Map()
      }],
      historyIndex: 0,
    };
    setSheets([...sheets, newSheet]);
    setActiveSheetId(newSheet.id);
    toast({
      title: "Sheet created",
      description: `${newSheet.name} has been created`,
    });
  };

  const handleSheetChange = (sheetId: string) => {
    setActiveSheetId(sheetId);
    setSelectedCells([]);
    setTemporarySelectedCells([]);
    if (tempSelectionTimerRef.current) {
      clearTimeout(tempSelectionTimerRef.current);
    }
  };

  const handleRenameSheet = (sheetId: string, newName: string) => {
    setSheets(prev => prev.map(sheet => 
      sheet.id === sheetId ? { ...sheet, name: newName } : sheet
    ));
    toast({
      title: "Sheet renamed",
      description: `Sheet renamed to "${newName}"`,
    });
  };

  const handleDeleteSheet = (sheetId: string) => {
    if (sheets.length === 1) {
      toast({
        title: "Cannot delete",
        description: "You must have at least one sheet",
        variant: "destructive",
      });
      return;
    }
    
    const sheetIndex = sheets.findIndex(s => s.id === sheetId);
    const newSheets = sheets.filter(s => s.id !== sheetId);
    setSheets(newSheets);
    
    if (activeSheetId === sheetId) {
      const newActiveSheet = newSheets[Math.max(0, sheetIndex - 1)];
      setActiveSheetId(newActiveSheet.id);
    }
    
    toast({
      title: "Sheet deleted",
      description: "Sheet has been deleted",
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col lg:w-2/3">
          <GoogleSheetsToolbar
          spreadsheetName={spreadsheetName}
          onSpreadsheetNameChange={setSpreadsheetName}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onFontFamilyChange={handleFontFamilyChange}
          onFontSizeChange={handleFontSizeChange}
          onBoldToggle={() => handleFontWeightChange(currentFontWeight === "bold" ? "normal" : "bold")}
          onItalicToggle={handleItalicToggle}
          onUnderlineToggle={handleUnderlineToggle}
          onTextColorApply={handleTextColorApply}
          onColorApply={handleColorApply}
          onBorderChange={handleBorderChange}
          currentFontFamily={currentFontFamily}
          currentFontSize={currentFontSize}
          currentFontWeight={currentFontWeight}
          currentFontStyle={currentFontStyle}
          currentTextDecoration={currentTextDecoration}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onDownload={handleDownloadClick}
          onAutoAdjust={handleAutoAdjust}
          isComplexMode={isComplexMode}
          onModeToggle={handleModeToggle}
          onMergeCells={handleMergeCells}
          onUnmergeCells={handleUnmergeCells}
          isMergedCell={isMergedCell}
        />
        <div 
          className="flex-1 overflow-hidden"
          onClick={(e) => {
            // Clear selection when clicking outside the grid (but not on grid elements)
            if (e.target === e.currentTarget) {
              setSelectedCells([]);
              setTemporarySelectedCells([]);
              if (tempSelectionTimerRef.current) {
                clearTimeout(tempSelectionTimerRef.current);
              }
            }
          }}
        >
          <SpreadsheetGrid
            rows={100}
            cols={52}
            selectedCells={selectedCells}
            temporarySelectedCells={temporarySelectedCells}
            onCellSelect={handleCellSelect}
            onRowSelect={handleRowSelect}
            onColumnSelect={handleColumnSelect}
            cellData={cellData}
            onCellChange={handleCellChange}
            onAddressChange={handleAddressChange}
            columnWidths={columnWidths}
            rowHeights={rowHeights}
            onColumnResize={(col, width) => {
              const newColumnWidths = new Map(columnWidths);
              newColumnWidths.set(col, width);
              saveToHistory(cellData, mergedCells, newColumnWidths, rowHeights);
              setColumnWidths(newColumnWidths);
            }}
            onRowResize={(row, height) => {
              const newRowHeights = new Map(rowHeights);
              newRowHeights.set(row, height);
              saveToHistory(cellData, mergedCells, columnWidths, newRowHeights);
              setRowHeights(newRowHeights);
            }}
            onDragSelection={handleDragSelection}
            onPaste={handlePaste}
            mergedCells={mergedCells}
            onDeleteRow={handleDeleteRow}
            onInsertRow={handleInsertRow}
            onDeleteColumn={handleDeleteColumn}
            onInsertColumn={handleInsertColumn}
            defaultFormatting={defaultFormatting}
          />
        </div>
      </div>
      <div className="w-full lg:w-1/3 border-t lg:border-t-0 lg:border-l border-border">
        <ControlPanel
          selectedCells={selectedCells}
          temporarySelectedCells={temporarySelectedCells}
          onColorApply={handleColorApply}
          onFormulaApply={handleFormulaApply}
          customFormulas={customFormulas}
          onAddCustomFormula={handleAddCustomFormula}
          onBulkAdd={handleBulkAdd}
          inputValue={inputValue}
          outputValue={outputValue}
          onInputChange={setInputValue}
          onOutputChange={setOutputValue}
          onShowInput={handleShowInput}
          onShowOutput={handleShowOutput}
        />
      </div>
      </div>
      <SheetTabs
        sheets={sheets.map(s => ({ id: s.id, name: s.name }))}
        activeSheetId={activeSheetId}
        onSheetChange={handleSheetChange}
        onAddSheet={handleAddSheet}
        onRenameSheet={handleRenameSheet}
        onDeleteSheet={handleDeleteSheet}
      />

      {/* Download Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent data-testid="dialog-download">
          <DialogHeader>
            <DialogTitle>Download Spreadsheet</DialogTitle>
            <DialogDescription>
              Enter a name for your Excel file. The file will be downloaded to your browser's download folder.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="filename">File Name</Label>
              <Input
                id="filename"
                value={downloadFileName}
                onChange={(e) => setDownloadFileName(e.target.value)}
                placeholder="My Spreadsheet"
                data-testid="input-filename"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDownloadDialog(false)}
              data-testid="button-cancel-download"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDownload}
              data-testid="button-confirm-download"
            >
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
