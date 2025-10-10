import { useState } from "react";
import SpreadsheetCell from "./SpreadsheetCell";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CellData {
  address: string;
  value: string;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: string;
}

interface SpreadsheetGridProps {
  rows?: number;
  cols?: number;
  selectedCells: string[];
  onCellSelect: (address: string) => void;
  cellData: Map<string, CellData>;
  onCellChange: (address: string, value: string) => void;
}

export default function SpreadsheetGrid({
  rows = 20,
  cols = 10,
  selectedCells,
  onCellSelect,
  cellData,
  onCellChange,
}: SpreadsheetGridProps) {
  const getColumnLabel = (index: number): string => {
    let label = "";
    let num = index;
    while (num >= 0) {
      label = String.fromCharCode(65 + (num % 26)) + label;
      num = Math.floor(num / 26) - 1;
    }
    return label;
  };

  const getCellAddress = (row: number, col: number): string => {
    return `${getColumnLabel(col)}${row + 1}`;
  };

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-4">
        <div className="inline-block border border-border">
          <div className="flex">
            <div className="w-12 h-8 bg-card border-r border-border flex items-center justify-center sticky left-0 z-10" />
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div
                key={colIndex}
                className="w-20 h-8 bg-card border-r border-border flex items-center justify-center font-semibold text-sm sticky top-0 z-10"
                data-testid={`header-col-${getColumnLabel(colIndex)}`}
              >
                {getColumnLabel(colIndex)}
              </div>
            ))}
          </div>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex">
              <div
                className="w-12 h-8 bg-card border-r border-b border-border flex items-center justify-center text-sm font-medium sticky left-0 z-10"
                data-testid={`header-row-${rowIndex + 1}`}
              >
                {rowIndex + 1}
              </div>
              {Array.from({ length: cols }).map((_, colIndex) => {
                const address = getCellAddress(rowIndex, colIndex);
                const cell = cellData.get(address) || {
                  address,
                  value: "",
                  backgroundColor: "transparent",
                  fontSize: 14,
                  fontWeight: "normal",
                };
                return (
                  <SpreadsheetCell
                    key={address}
                    address={address}
                    value={cell.value}
                    isSelected={selectedCells.includes(address)}
                    backgroundColor={cell.backgroundColor}
                    fontSize={cell.fontSize}
                    fontWeight={cell.fontWeight}
                    onClick={() => onCellSelect(address)}
                    onDoubleClick={() => console.log(`Double clicked ${address}`)}
                    onChange={(value) => onCellChange(address, value)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
