import { useState, useEffect, useRef, useCallback } from "react";
import SpreadsheetGrid from "@/components/SpreadsheetGrid";
import ControlPanel from "@/components/ControlPanel";
import GoogleSheetsToolbar from "@/components/GoogleSheetsToolbar";
import SheetTabs from "@/components/SheetTabs";
import { useToast } from "@/hooks/use-toast";

interface CellData {
  address: string;
  value: string;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  fontStyle?: string;
  textDecoration?: string;
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
  history: { cellData: Map<string, CellData>; mergedCells: MergedCell[] }[];
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
      history: [{ cellData: new Map(), mergedCells: [] }],
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
  const [defaultFormatting, setDefaultFormatting] = useState<{
    fontSize?: number;
    fontWeight?: string;
    fontFamily?: string;
    fontStyle?: string;
    textDecoration?: string;
    backgroundColor?: string;
  }>({
    fontSize: 13,
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
  
  const setHistory = (hist: { cellData: Map<string, CellData>; mergedCells: MergedCell[] }[]) => updateActiveSheet({ history: hist });
  const setHistoryIndex = (index: number) => updateActiveSheet({ historyIndex: index });

  const saveToHistory = (newCellData: Map<string, CellData>, newMergedCells: MergedCell[] = mergedCells) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ cellData: new Map(newCellData), mergedCells: [...newMergedCells] });
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
    
    // Explicitly blur currently focused element before moving to new cell
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    // Move selection to new cell
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
    // Clear any permanent selections first (row/column selections)
    setSelectedCells([]);
    
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

  const handleColorApply = (color: string) => {
    const allSelected = [...selectedCells, ...temporarySelectedCells];
    
    // If no cells selected, apply to ALL cells (update global default)
    if (allSelected.length === 0) {
      setDefaultFormatting(prev => ({
        ...prev,
        backgroundColor: color === "transparent" ? undefined : color,
      }));
      
      // Show all cells as selected with 5-second timer
      const allCellAddresses: string[] = [];
      for (let row = 0; row < 100; row++) {
        for (let col = 0; col < 52; col++) {
          const colLabel = getColumnLabel(col);
          allCellAddresses.push(`${colLabel}${row + 1}`);
        }
      }
      setTemporarySelectedCells(allCellAddresses);
      
      // Start 5-second timer
      if (tempSelectionTimerRef.current) {
        clearTimeout(tempSelectionTimerRef.current);
      }
      tempSelectionTimerRef.current = setTimeout(() => {
        setTemporarySelectedCells([]);
      }, 5000);
      
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
    
    // If no cells selected, apply to ALL cells (update global default)
    if (allSelected.length === 0) {
      setDefaultFormatting(prev => ({
        ...prev,
        fontWeight: weight,
      }));
      
      // Show all cells as selected with 5-second timer
      const allCellAddresses: string[] = [];
      for (let row = 0; row < 100; row++) {
        for (let col = 0; col < 52; col++) {
          const colLabel = getColumnLabel(col);
          allCellAddresses.push(`${colLabel}${row + 1}`);
        }
      }
      setTemporarySelectedCells(allCellAddresses);
      
      // Start 5-second timer
      if (tempSelectionTimerRef.current) {
        clearTimeout(tempSelectionTimerRef.current);
      }
      tempSelectionTimerRef.current = setTimeout(() => {
        setTemporarySelectedCells([]);
      }, 5000);
      
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
    
    // If no cells selected, apply to ALL cells (update global default)
    if (allSelected.length === 0) {
      setDefaultFormatting(prev => {
        const currentStyle = prev.fontStyle || "normal";
        return {
          ...prev,
          fontStyle: currentStyle === "italic" ? "normal" : "italic"
        };
      });
      
      // Show all cells as selected with 5-second timer
      const allCellAddresses: string[] = [];
      for (let row = 0; row < 100; row++) {
        for (let col = 0; col < 52; col++) {
          const colLabel = getColumnLabel(col);
          allCellAddresses.push(`${colLabel}${row + 1}`);
        }
      }
      setTemporarySelectedCells(allCellAddresses);
      
      // Start 5-second timer
      if (tempSelectionTimerRef.current) {
        clearTimeout(tempSelectionTimerRef.current);
      }
      tempSelectionTimerRef.current = setTimeout(() => {
        setTemporarySelectedCells([]);
      }, 5000);
      
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
    
    // If no cells selected, apply to ALL cells (update global default)
    if (allSelected.length === 0) {
      setDefaultFormatting(prev => {
        const currentDecoration = prev.textDecoration || "none";
        return {
          ...prev,
          textDecoration: currentDecoration === "underline" ? "none" : "underline"
        };
      });
      
      // Show all cells as selected with 5-second timer
      const allCellAddresses: string[] = [];
      for (let row = 0; row < 100; row++) {
        for (let col = 0; col < 52; col++) {
          const colLabel = getColumnLabel(col);
          allCellAddresses.push(`${colLabel}${row + 1}`);
        }
      }
      setTemporarySelectedCells(allCellAddresses);
      
      // Start 5-second timer
      if (tempSelectionTimerRef.current) {
        clearTimeout(tempSelectionTimerRef.current);
      }
      tempSelectionTimerRef.current = setTimeout(() => {
        setTemporarySelectedCells([]);
      }, 5000);
      
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
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCellData(new Map(history[historyIndex + 1].cellData));
      setMergedCells([...history[historyIndex + 1].mergedCells]);
    }
  };

  const handleMergeCells = (type: 'all' | 'vertical' | 'horizontal' = 'all') => {
    if (selectedCells.length < 2) return;

    if (selectedCells.length > 100) {
      toast({
        title: "Too Many Cells Selected",
        description: `You selected ${selectedCells.length} cells. Please select 100 or fewer cells to merge.`,
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

    const cells = selectedCells.map(addr => ({ addr, ...getCellRowCol(addr) }));
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

    const values = selectedCells
      .map((addr) => cellData.get(addr)?.value || "")
      .filter((val) => val !== "")
      .join(" ");

    const newData = new Map(cellData);
    
    selectedCells.forEach((addr) => {
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
    setSelectedCells([startAddress]);
  };

  const handleUnmergeCells = () => {
    if (selectedCells.length !== 1) return;
    
    const selectedAddress = selectedCells[0];
    const mergedCell = mergedCells.find(m => m.startAddress === selectedAddress);
    
    if (!mergedCell) return;

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
    setSelectedCells(allCellsInMerge);
  };

  const handleDownload = async () => {
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      
      const rows = 100;
      const cols = 52;
      
      // Set column widths
      for (let colIndex = 0; colIndex < cols; colIndex++) {
        const width = columnWidths.get(colIndex) || 100; // Google Sheets default: 100px
        // Excel column width is in "character units" (8.43 chars = 64px in Calibri 11pt)
        // Direct conversion: pixels / 7.6 (64px / 8.43 chars ≈ 7.6 pixels per char)
        worksheet.getColumn(colIndex + 1).width = width / 7.6;
      }
      
      // Set row heights and cell data
      for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
        const row = worksheet.getRow(rowIndex + 1);
        // For Excel export, use proper readable height (21px default)
        // Even if web app shows 10.5px, Excel needs standard height
        const webHeight = rowHeights.get(rowIndex) || 10.5;
        const excelHeight = webHeight < 15 ? 21 : webHeight; // Minimum 21px for Excel
        // Excel height is in points (20px = 15 points, so 1 pixel = 0.75 points)
        row.height = excelHeight * 0.75;
        
        for (let colIndex = 0; colIndex < cols; colIndex++) {
          const address = `${getColumnLabel(colIndex)}${rowIndex + 1}`;
          const cellData_item = cellData.get(address);
          
          if (cellData_item) {
            const excelCell = row.getCell(colIndex + 1);
            excelCell.value = cellData_item.value || "";
            
            // Apply font formatting (use same defaults as UI: 10pt Arial)
            const fontFamily = cellData_item.fontFamily || 'Arial'; // Google Sheets default
            const fontSize = cellData_item.fontSize || 10; // Google Sheets default
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
            
            // Apply cell background color
            if (cellData_item.backgroundColor) {
              const color = cellData_item.backgroundColor.replace('#', '');
              excelCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF' + color },
              };
            }
            
            // Add borders to all cells (so they're visible even with background colors)
            excelCell.border = {
              top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
              left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
              bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
              right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            };
            
            // Enable text wrapping for multi-line content
            excelCell.alignment = {
              wrapText: true,
              vertical: 'top',
              horizontal: 'left',
            };
          }
        }
      }
      
      // Apply merged cells
      mergedCells.forEach(merge => {
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
      
      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
      });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${spreadsheetName}.xlsx`;
      
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
        description: `${spreadsheetName}.xlsx has been downloaded with all formatting preserved.`,
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

  const isMergedCell = selectedCells.length === 1 && mergedCells.some(m => m.startAddress === selectedCells[0]);
  
  const getFirstSelectedCell = () => {
    const firstCell = selectedCells[0] || temporarySelectedCells[0];
    return firstCell ? cellData.get(firstCell) : undefined;
  };
  
  const firstCell = getFirstSelectedCell();
  const currentFontSize = firstCell?.fontSize || defaultFormatting.fontSize || 13;
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
      history: [{ cellData: new Map(), mergedCells: [] }],
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
          onColorApply={handleColorApply}
          currentFontFamily={currentFontFamily}
          currentFontSize={currentFontSize}
          currentFontWeight={currentFontWeight}
          currentFontStyle={currentFontStyle}
          currentTextDecoration={currentTextDecoration}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onDownload={handleDownload}
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
              setColumnWidths((prev) => {
                const newMap = new Map(prev);
                newMap.set(col, width);
                return newMap;
              });
            }}
            onRowResize={(row, height) => {
              setRowHeights((prev) => new Map(prev).set(row, height));
            }}
            onDragSelection={handleDragSelection}
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
    </div>
  );
}
