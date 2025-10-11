import { useState, useEffect, useRef, useCallback } from "react";
import SpreadsheetGrid from "@/components/SpreadsheetGrid";
import ControlPanel from "@/components/ControlPanel";
import ThemeToggle from "@/components/ThemeToggle";
import ExcelFontControls from "@/components/ExcelFontControls";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, MousePointer2, Lock, Check, Split } from "lucide-react";

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
    
    if (!retainSelection) {
      setSelectedCells([]);
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
    
    if (!retainSelection) {
      setSelectedCells([]);
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
    
    if (!retainSelection) {
      setSelectedCells([]);
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
    
    if (!retainSelection) {
      setSelectedCells([]);
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
    
    if (!retainSelection) {
      setSelectedCells([]);
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

  const handleDownload = () => {
    const rows = 100;
    const cols = 52;
    
    let csvContent = "";
    
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      const rowData: string[] = [];
      for (let colIndex = 0; colIndex < cols; colIndex++) {
        const address = `${getColumnLabel(colIndex)}${rowIndex + 1}`;
        const cell = cellData.get(address);
        const value = cell?.value || "";
        rowData.push(`"${value.replace(/"/g, '""')}"`);
      }
      csvContent += rowData.join(",") + "\n";
    }
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${spreadsheetName}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Downloaded Successfully",
      description: `${spreadsheetName}.csv has been downloaded.`,
    });
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
  const currentFontSize = firstCell?.fontSize || 11;
  const currentFontWeight = firstCell?.fontWeight || "normal";
  const currentFontFamily = firstCell?.fontFamily || "Calibri";
  const currentFontStyle = firstCell?.fontStyle || "normal";
  const currentTextDecoration = firstCell?.textDecoration || "none";

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background">
      <div className="flex-1 flex flex-col lg:w-2/3">
        <header className="border-b border-border bg-card">
          <div className="flex items-center justify-between px-4 lg:px-6 py-2 border-b border-border">
            <div className="flex items-center gap-2">
              <h1 className="text-lg lg:text-xl font-semibold" data-testid="text-app-title">
                StyleSheet
              </h1>
              <span className="hidden sm:inline text-sm text-muted-foreground">Excel-like Builder</span>
            </div>
            <div className="flex items-center gap-2 lg:gap-3">
              <Input
                type="text"
                value={spreadsheetName}
                onChange={(e) => setSpreadsheetName(e.target.value)}
                placeholder="Spreadsheet Name"
                className="w-32 sm:w-48"
                data-testid="input-spreadsheet-name"
              />
              <Button
                onClick={handleDownload}
                variant="default"
                size="sm"
                data-testid="button-download"
              >
                <Download className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Download</span>
              </Button>
              <ThemeToggle />
            </div>
          </div>
          
          <div className="px-4 lg:px-6 py-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={selectedCells.length > 0 ? "default" : "secondary"}
                size="sm"
                onClick={handleSelectAll}
                data-testid="button-select-all"
              >
                <MousePointer2 className="w-4 h-4 mr-2" />
                Select
              </Button>
              
              <Button
                variant={retainSelection ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setRetainSelection(!retainSelection)}
                data-testid="button-retain-selection"
              >
                <Lock className="w-4 h-4" />
              </Button>
              
              <div className="h-6 w-px bg-border" />
              
              <Button
                variant="secondary"
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={handleMergeCells}
                disabled={selectedCells.length < 2}
                data-testid="button-merge-cells"
              >
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Merge
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={handleUnmergeCells}
                disabled={!isMergedCell}
                data-testid="button-unmerge-cells"
              >
                <Split className="w-3.5 h-3.5 mr-1.5" />
                Unmerge
              </Button>
              
              <div className="h-6 w-px bg-border" />
              
              <ExcelFontControls
                onFontSizeChange={handleFontSizeChange}
                onFontWeightChange={handleFontWeightChange}
                onFontFamilyChange={handleFontFamilyChange}
                onItalicToggle={handleItalicToggle}
                onUnderlineToggle={handleUnderlineToggle}
                currentFontSize={currentFontSize}
                currentFontWeight={currentFontWeight}
                currentFontFamily={currentFontFamily}
                currentFontStyle={currentFontStyle}
                currentTextDecoration={currentTextDecoration}
              />
            </div>
          </div>
        </header>
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
