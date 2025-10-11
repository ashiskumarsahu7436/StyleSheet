import { useState, useEffect, useRef } from "react";
import SpreadsheetGrid from "@/components/SpreadsheetGrid";
import ControlPanel from "@/components/ControlPanel";
import ThemeToggle from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";

interface CellData {
  address: string;
  value: string;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: string;
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
    if (selectedCells.length === 0) return;
    
    const newData = new Map(cellData);
    selectedCells.forEach((address) => {
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
    if (selectedCells.length === 0) return;
    
    const newData = new Map(cellData);
    selectedCells.forEach((address) => {
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
    if (selectedCells.length === 0) return;
    
    const newData = new Map(cellData);
    selectedCells.forEach((address) => {
      const existing = newData.get(address) || { address, value: "" };
      newData.set(address, { ...existing, fontWeight: weight });
    });
    
    saveToHistory(newData);
    setCellData(newData);
    
    if (!retainSelection) {
      setSelectedCells([]);
    }
  };

  const handleShowInput = () => {
    const values = selectedCells.map((addr) => cellData.get(addr)?.value || "").join(", ");
    setInputValue(values);
  };

  const handleShowOutput = () => {
    const addresses = selectedCells.join(", ");
    setOutputValue(addresses);
  };

  const handleFormulaApply = (formula: string) => {
    if (selectedCells.length === 0) return;

    const values = selectedCells
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
    if (selectedCells.length === 0) return;

    const newData = new Map(cellData);
    selectedCells.forEach((address, index) => {
      if (index < values.length) {
        const existing = newData.get(address) || { address, value: "" };
        newData.set(address, { ...existing, value: values[index] });
      }
    });
    
    saveToHistory(newData);
    setCellData(newData);
  };

  const handleSelectAll = () => {
    if (selectedCells.length > 0) {
      setSelectedCells([]);
    } else {
      const allCells: string[] = [];
      for (let row = 0; row < 100; row++) {
        for (let col = 0; col < 52; col++) {
          const colLabel = getColumnLabel(col);
          allCells.push(`${colLabel}${row + 1}`);
        }
      }
      setSelectedCells(allCells);
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
    
    newData.set(startAddress, { 
      address: startAddress,
      value: values,
      backgroundColor: cellData.get(startAddress)?.backgroundColor,
      fontSize: cellData.get(startAddress)?.fontSize,
      fontWeight: cellData.get(startAddress)?.fontWeight,
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

  useEffect(() => {
    return () => {
      if (tempSelectionTimerRef.current) {
        clearTimeout(tempSelectionTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col" style={{ width: "66.666%" }}>
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold" data-testid="text-app-title">
              StyleSheet
            </h1>
            <span className="text-sm text-muted-foreground">Excel-like Builder</span>
          </div>
          <ThemeToggle />
        </header>
        <div className="flex-1 overflow-hidden">
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
              setColumnWidths((prev) => new Map(prev).set(col, width));
            }}
            onRowResize={(row, height) => {
              setRowHeights((prev) => new Map(prev).set(row, height));
            }}
            onDragSelection={handleDragSelection}
            mergedCells={mergedCells}
          />
        </div>
      </div>
      <div style={{ width: "33.333%" }}>
        <ControlPanel
          selectedCells={selectedCells}
          temporarySelectedCells={temporarySelectedCells}
          onMakePermanent={handleMakePermanent}
          onColorApply={handleColorApply}
          onFontSizeChange={handleFontSizeChange}
          onFontWeightChange={handleFontWeightChange}
          onFormulaApply={handleFormulaApply}
          customFormulas={customFormulas}
          onAddCustomFormula={handleAddCustomFormula}
          onBulkAdd={handleBulkAdd}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSelectAll={handleSelectAll}
          onMergeCells={handleMergeCells}
          onUnmergeCells={handleUnmergeCells}
          mergedCells={mergedCells}
          inputValue={inputValue}
          outputValue={outputValue}
          onInputChange={setInputValue}
          onOutputChange={setOutputValue}
          onShowInput={handleShowInput}
          onShowOutput={handleShowOutput}
          retainSelection={retainSelection}
          onToggleRetainSelection={() => setRetainSelection(!retainSelection)}
        />
      </div>
    </div>
  );
}
