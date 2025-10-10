import { useState } from "react";
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
  const [cellData, setCellData] = useState<Map<string, CellData>>(new Map());
  const [inputValue, setInputValue] = useState("");
  const [outputValue, setOutputValue] = useState("");

  const handleCellSelect = (address: string) => {
    setSelectedCells((prev) => {
      if (prev.includes(address)) {
        return prev.filter((a) => a !== address);
      }
      return [...prev, address];
    });
  };

  const handleCellChange = (address: string, value: string) => {
    setCellData((prev) => {
      const newData = new Map(prev);
      const existing = newData.get(address) || { address, value: "" };
      newData.set(address, { ...existing, value });
      return newData;
    });
  };

  const handleColorSelect = (color: string) => {
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
    const cellList = selectedCells.join(", ");
    setInputValue(cellList);
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

    let result = 0;
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

    setOutputValue(`${formula}: ${result}`);
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
    const allCells: string[] = [];
    for (let row = 0; row < 20; row++) {
      for (let col = 0; col < 10; col++) {
        const colLabel = String.fromCharCode(65 + col);
        allCells.push(`${colLabel}${row + 1}`);
      }
    }
    setSelectedCells(allCells);
  };

  const handleUndo = () => {
    console.log("Undo action");
  };

  const handleRedo = () => {
    console.log("Redo action");
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
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
            rows={20}
            cols={10}
            selectedCells={selectedCells}
            onCellSelect={handleCellSelect}
            cellData={cellData}
            onCellChange={handleCellChange}
          />
        </div>
      </div>
      <ControlPanel
        selectedCells={selectedCells}
        onColorSelect={handleColorSelect}
        onFontSizeChange={handleFontSizeChange}
        onFontWeightChange={handleFontWeightChange}
        onFormulaApply={handleFormulaApply}
        onBulkAdd={handleBulkAdd}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSelectAll={handleSelectAll}
        inputValue={inputValue}
        outputValue={outputValue}
        onInputChange={setInputValue}
        onOutputChange={setOutputValue}
        onShowInput={handleShowInput}
        onShowOutput={handleShowOutput}
      />
    </div>
  );
}
