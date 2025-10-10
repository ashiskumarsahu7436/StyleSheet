import { useState, useEffect, useRef } from "react";
import SpreadsheetGrid from "@/components/SpreadsheetGrid";
import ControlPanel from "@/components/ControlPanel";
import ThemeToggle from "@/components/ThemeToggle";

interface CellData {
  address: string;
  value: string;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: string;
}

export default function Home() {
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  const [temporarySelectedCells, setTemporarySelectedCells] = useState<string[]>([]);
  const [cellData, setCellData] = useState<Map<string, CellData>>(new Map());
  const [inputValue, setInputValue] = useState("");
  const [outputValue, setOutputValue] = useState("");
  const [columnWidths, setColumnWidths] = useState<Map<number, number>>(new Map());
  const [rowHeights, setRowHeights] = useState<Map<number, number>>(new Map());
  const [customFormulas, setCustomFormulas] = useState<Array<{ name: string; logic: string }>>([]);
  const tempSelectionTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    setCellData((prev) => {
      const newData = new Map(prev);
      const existing = newData.get(address) || { address, value: "" };
      newData.set(address, { ...existing, value });
      return newData;
    });
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
    
    setCellData((prev) => {
      const newData = new Map(prev);
      selectedCells.forEach((address) => {
        const existing = newData.get(address) || { address, value: "" };
        newData.set(address, {
          ...existing,
          backgroundColor: color === "transparent" ? undefined : color,
        });
      });
      return newData;
    });
    
    setSelectedCells([]);
  };

  const handleFontSizeChange = (size: number) => {
    if (selectedCells.length === 0) return;
    
    setCellData((prev) => {
      const newData = new Map(prev);
      selectedCells.forEach((address) => {
        const existing = newData.get(address) || { address, value: "" };
        newData.set(address, { ...existing, fontSize: size });
      });
      return newData;
    });
  };

  const handleFontWeightChange = (weight: string) => {
    if (selectedCells.length === 0) return;
    
    setCellData((prev) => {
      const newData = new Map(prev);
      selectedCells.forEach((address) => {
        const existing = newData.get(address) || { address, value: "" };
        newData.set(address, { ...existing, fontWeight: weight });
      });
      return newData;
    });
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

    setCellData((prev) => {
      const newData = new Map(prev);
      selectedCells.forEach((address, index) => {
        if (index < values.length) {
          const existing = newData.get(address) || { address, value: "" };
          newData.set(address, { ...existing, value: values[index] });
        }
      });
      return newData;
    });
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
    console.log("Undo action");
  };

  const handleRedo = () => {
    console.log("Redo action");
  };

  const handleMergeCells = () => {
    if (selectedCells.length < 2) return;

    const firstCell = selectedCells[0];
    const values = selectedCells
      .map((addr) => cellData.get(addr)?.value || "")
      .filter((val) => val !== "")
      .join(" ");

    setCellData((prev) => {
      const newData = new Map(prev);
      selectedCells.forEach((addr) => {
        if (addr !== firstCell) {
          newData.delete(addr);
        }
      });
      
      const firstCellData = newData.get(firstCell) || { address: firstCell, value: "" };
      newData.set(firstCell, { ...firstCellData, value: values });
      
      return newData;
    });

    setSelectedCells([firstCell]);
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
