import { useState, useEffect, useRef, useCallback } from "react";
import SpreadsheetGrid from "@/components/SpreadsheetGrid";
import ControlPanel from "@/components/ControlPanel";
import GoogleSheetsToolbar from "@/components/GoogleSheetsToolbar";
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

export default function Home() {
  const { toast } = useToast();
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  const [temporarySelectedCells, setTemporarySelectedCells] = useState<string[]>([]);
  const [cellData, setCellData] = useState<Map<string, CellData>>(new Map());
  const [inputValue, setInputValue] = useState("");
  const [outputValue, setOutputValue] = useState("");
  const [columnWidths, setColumnWidths] = useState<Map<number, number>>(new Map());
  const [rowHeights, setRowHeights] = useState<Map<number, number>>(new Map());
  const [customFormulas, setCustomFormulas] = useState<Array<{ name: string; logic: string }>>([]);
  const [retainSelection, setRetainSelection] = useState(false);
  const [history, setHistory] = useState<{ cellData: Map<string, CellData>; mergedCells: MergedCell[] }[]>([
    { cellData: new Map(), mergedCells: [] }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [mergedCells, setMergedCells] = useState<MergedCell[]>([]);
  const [spreadsheetName, setSpreadsheetName] = useState("My Spreadsheet");
  const tempSelectionTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleCellSelect = (address: string) => {
    setSelectedCells((prev) => {
      if (prev.includes(address)) {
        return prev.filter((a) => a !== address);
      }
      return [...prev, address];
    });
  };

  const handleRowSelect = (rowIndex: number) => {
    const rowCells: string[] = [];
    for (let col = 0; col < 52; col++) {
      const colLabel = getColumnLabel(col);
      rowCells.push(`${colLabel}${rowIndex + 1}`);
    }
    setSelectedCells(rowCells);
  };

  const handleColumnSelect = (colIndex: number) => {
    const colCells: string[] = [];
    const colLabel = getColumnLabel(colIndex);
    for (let row = 0; row < 100; row++) {
      colCells.push(`${colLabel}${row + 1}`);
    }
    setSelectedCells(colCells);
  };

  const handleDragSelection = (addresses: string[]) => {
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
    
    // Auto-adjust column width and row height when typing
    const match = address.match(/^([A-Z]+)(\d+)$/);
    if (match) {
      const colLabel = match[1];
      const rowIndex = parseInt(match[2]) - 1;
      
      // Calculate column index
      let colIndex = 0;
      for (let i = 0; i < colLabel.length; i++) {
        colIndex = colIndex * 26 + (colLabel.charCodeAt(i) - 65 + 1);
      }
      colIndex = colIndex - 1;
      
      // Get cell formatting
      const fontSize = existing.fontSize || 10; // Google Sheets default
      const fontFamily = existing.fontFamily || 'Arial'; // Google Sheets default
      const fontWeight = existing.fontWeight || 'normal';
      
      // Measure text width
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        const textWidth = context.measureText(value).width;
        
        // Add padding (px-1 = 4px on each side, so 8px total, plus some buffer)
        const requiredWidth = textWidth + 16;
        const maxWidth = 300; // Max width
        const minWidth = 100; // Google Sheets default column width
        const currentWidth = columnWidths.get(colIndex) || minWidth;
        
        // Auto-adjust column width (Google Sheets behavior: only increase, never decrease)
        const finalWidth = Math.max(Math.min(requiredWidth, maxWidth), currentWidth);
        if (finalWidth > currentWidth) {
          setColumnWidths(prev => {
            const newMap = new Map(prev);
            newMap.set(colIndex, finalWidth);
            return newMap;
          });
        }
        
        // Calculate wrapped lines - use actual column width for wrapping
        const actualColumnWidth = columnWidths.get(colIndex) || 100; // Google Sheets default
        const effectiveWidth = actualColumnWidth - 8; // subtract padding (px-1 = 4px each side)
        
        // Split text by newlines first (for Enter key), then wrap words
        const lines = value.split('\n');
        let totalLines = 0;
        
        lines.forEach(line => {
          if (line.trim() === '') {
            totalLines += 1;
            return;
          }
          
          const words = line.split(/\s+/);
          let currentLineWidth = 0;
          let wrappedLines = 1;
          
          for (const word of words) {
            const wordWidth = context.measureText(word).width;
            const spaceWidth = context.measureText(' ').width;
            
            // Check if single word is too long and needs to be broken
            if (wordWidth > effectiveWidth) {
              // Word needs character-level breaking
              let charLine = '';
              for (let char of word) {
                const testWidth = context.measureText(charLine + char).width;
                if (testWidth > effectiveWidth && charLine.length > 0) {
                  wrappedLines++;
                  charLine = char;
                } else {
                  charLine += char;
                }
              }
              currentLineWidth = context.measureText(charLine).width + spaceWidth;
            } else {
              // Normal word wrapping
              const totalWidth = currentLineWidth + wordWidth + (currentLineWidth > 0 ? spaceWidth : 0);
              if (totalWidth > effectiveWidth && currentLineWidth > 0) {
                wrappedLines++;
                currentLineWidth = wordWidth + spaceWidth;
              } else {
                currentLineWidth = totalWidth;
              }
            }
          }
          totalLines += wrappedLines;
        });
        
        // Auto-adjust row height based on lines (both increase and decrease)
        const lineHeight = fontSize * 1.4; // line height multiplier
        const requiredHeight = Math.max(totalLines * lineHeight + 6, 21); // add small padding, min 21px
        const minHeight = 21; // Google Sheets default row height
        
        // Always update height (can increase or decrease)
        setRowHeights(prev => {
          const newMap = new Map(prev);
          if (requiredHeight > minHeight) {
            newMap.set(rowIndex, requiredHeight);
          } else {
            newMap.delete(rowIndex); // Reset to default if not needed
          }
          return newMap;
        });
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
    if (allSelected.length === 0) return;
    
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
    if (allSelected.length === 0) return;
    
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
    if (allSelected.length === 0) return;
    
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
    if (allSelected.length === 0) return;
    
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
    if (allSelected.length === 0) return;
    
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
    if (allSelected.length === 0) return;
    
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

  const handleMergeCells = () => {
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
    const minRow = Math.min(...cells.map(c => c.row));
    const maxRow = Math.max(...cells.map(c => c.row));
    const minCol = Math.min(...cells.map(c => c.col));
    const maxCol = Math.max(...cells.map(c => c.col));

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
        const height = rowHeights.get(rowIndex) || 21; // Google Sheets default: 21px
        // Excel height is in points (20px = 15 points, so 1 pixel = 0.75 points)
        row.height = height * 0.75;
        
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

  useEffect(() => {
    return () => {
      if (tempSelectionTimerRef.current) {
        clearTimeout(tempSelectionTimerRef.current);
      }
    };
  }, []);

  const isMergedCell = selectedCells.length === 1 && mergedCells.some(m => m.startAddress === selectedCells[0]);
  
  const getFirstSelectedCell = () => {
    const firstCell = selectedCells[0] || temporarySelectedCells[0];
    return firstCell ? cellData.get(firstCell) : undefined;
  };
  
  const firstCell = getFirstSelectedCell();
  const currentFontSize = firstCell?.fontSize || 10; // Google Sheets default
  const currentFontWeight = firstCell?.fontWeight || "normal";
  const currentFontFamily = firstCell?.fontFamily || "Arial"; // Google Sheets default
  const currentFontStyle = firstCell?.fontStyle || "normal";
  const currentTextDecoration = firstCell?.textDecoration || "none";

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background">
      <div className="flex-1 flex flex-col lg:w-2/3">
        <GoogleSheetsToolbar
          spreadsheetName={spreadsheetName}
          onSpreadsheetNameChange={setSpreadsheetName}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onDownload={handleDownload}
          onFontFamilyChange={handleFontFamilyChange}
          onFontSizeChange={handleFontSizeChange}
          onBoldToggle={() => handleFontWeightChange(currentFontWeight === "bold" ? "normal" : "bold")}
          onItalicToggle={handleItalicToggle}
          onUnderlineToggle={handleUnderlineToggle}
          onColorApply={handleColorApply}
          onMergeCells={handleMergeCells}
          onUnmergeCells={handleUnmergeCells}
          currentFontFamily={currentFontFamily}
          currentFontSize={currentFontSize}
          currentFontWeight={currentFontWeight}
          currentFontStyle={currentFontStyle}
          currentTextDecoration={currentTextDecoration}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
        />
        <div 
          className="flex-1 overflow-hidden"
          onDoubleClick={(e) => {
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
          onUndo={handleUndo}
          onRedo={handleRedo}
          inputValue={inputValue}
          outputValue={outputValue}
          onInputChange={setInputValue}
          onOutputChange={setOutputValue}
          onShowInput={handleShowInput}
          onShowOutput={handleShowOutput}
        />
      </div>
    </div>
  );
}
