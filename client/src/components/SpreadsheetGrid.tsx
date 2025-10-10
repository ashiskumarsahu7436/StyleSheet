import { useState, useRef } from "react";
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
  temporarySelectedCells?: string[];
  onCellSelect: (address: string) => void;
  onRowSelect: (rowIndex: number) => void;
  onColumnSelect: (colIndex: number) => void;
  cellData: Map<string, CellData>;
  onCellChange: (address: string, value: string) => void;
  onAddressChange?: (oldAddress: string, newAddress: string) => void;
  columnWidths?: Map<number, number>;
  rowHeights?: Map<number, number>;
  onColumnResize?: (colIndex: number, width: number) => void;
  onRowResize?: (rowIndex: number, height: number) => void;
  onDragSelection?: (addresses: string[]) => void;
}

export default function SpreadsheetGrid({
  rows = 20,
  cols = 10,
  selectedCells,
  temporarySelectedCells = [],
  onCellSelect,
  onRowSelect,
  onColumnSelect,
  cellData,
  onCellChange,
  onAddressChange,
  columnWidths = new Map(),
  rowHeights = new Map(),
  onColumnResize,
  onRowResize,
  onDragSelection,
}: SpreadsheetGridProps) {
  const [resizingCol, setResizingCol] = useState<number | null>(null);
  const [resizingRow, setResizingRow] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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

  const handleColumnBorderMouseDown = (e: React.MouseEvent, colIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingCol(colIndex);
    startPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleRowBorderMouseDown = (e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingRow(rowIndex);
    startPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (resizingCol !== null && onColumnResize) {
      const deltaX = e.clientX - startPosRef.current.x;
      const currentWidth = columnWidths.get(resizingCol) || 80;
      const newWidth = Math.max(40, currentWidth + deltaX);
      onColumnResize(resizingCol, newWidth);
      startPosRef.current = { x: e.clientX, y: e.clientY };
    } else if (resizingRow !== null && onRowResize) {
      const deltaY = e.clientY - startPosRef.current.y;
      const currentHeight = rowHeights.get(resizingRow) || 32;
      const newHeight = Math.max(24, currentHeight + deltaY);
      onRowResize(resizingRow, newHeight);
      startPosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    setResizingCol(null);
    setResizingRow(null);
  };

  const handleCellMouseDown = (address: string) => {
    setIsDragging(true);
    setDragStart(address);
  };

  const handleCellMouseEnter = (address: string) => {
    if (isDragging && dragStart && onDragSelection) {
      const startRow = parseInt(dragStart.match(/\d+/)?.[0] || "1") - 1;
      const startCol = dragStart.charCodeAt(0) - 65;
      const endRow = parseInt(address.match(/\d+/)?.[0] || "1") - 1;
      const endCol = address.charCodeAt(0) - 65;

      const minRow = Math.min(startRow, endRow);
      const maxRow = Math.max(startRow, endRow);
      const minCol = Math.min(startCol, endCol);
      const maxCol = Math.max(startCol, endCol);

      const addresses: string[] = [];
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          addresses.push(getCellAddress(r, c));
        }
      }
      onDragSelection(addresses);
    }
  };

  const handleCellMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  return (
    <ScrollArea className="h-full w-full">
      <div
        className="p-4"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="inline-block border border-border">
          <div className="flex">
            <div className="w-12 h-8 bg-card border-r border-border flex items-center justify-center sticky left-0 z-10" />
            {Array.from({ length: cols }).map((_, colIndex) => {
              const width = columnWidths.get(colIndex) || 80;
              return (
                <div
                  key={colIndex}
                  className="relative bg-card border-r border-border flex items-center justify-center font-semibold text-sm sticky top-0 z-10 hover-elevate cursor-pointer"
                  style={{ width: `${width}px`, height: "32px" }}
                  onClick={() => onColumnSelect(colIndex)}
                  data-testid={`header-col-${getColumnLabel(colIndex)}`}
                >
                  {getColumnLabel(colIndex)}
                  <div
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                    onMouseDown={(e) => handleColumnBorderMouseDown(e, colIndex)}
                  />
                </div>
              );
            })}
          </div>
          {Array.from({ length: rows }).map((_, rowIndex) => {
            const height = rowHeights.get(rowIndex) || 32;
            return (
              <div key={rowIndex} className="flex relative">
                <div
                  className="relative w-12 bg-card border-r border-b border-border flex items-center justify-center text-sm font-medium sticky left-0 z-10 hover-elevate cursor-pointer"
                  style={{ height: `${height}px` }}
                  onClick={() => onRowSelect(rowIndex)}
                  data-testid={`header-row-${rowIndex + 1}`}
                >
                  {rowIndex + 1}
                  <div
                    className="absolute bottom-0 left-0 w-full h-1 cursor-row-resize hover:bg-primary/50"
                    onMouseDown={(e) => handleRowBorderMouseDown(e, rowIndex)}
                  />
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
                  const width = columnWidths.get(colIndex) || 80;
                  const isSelected = selectedCells.includes(address);
                  const isTemporary = temporarySelectedCells.includes(address);
                  
                  return (
                    <div
                      key={address}
                      style={{ width: `${width}px`, height: `${height}px` }}
                      onMouseDown={() => handleCellMouseDown(address)}
                      onMouseEnter={() => handleCellMouseEnter(address)}
                      onMouseUp={handleCellMouseUp}
                    >
                      <SpreadsheetCell
                        address={cell.address}
                        value={cell.value}
                        isSelected={isSelected}
                        isTemporary={isTemporary}
                        backgroundColor={cell.backgroundColor}
                        fontSize={cell.fontSize}
                        fontWeight={cell.fontWeight}
                        onClick={() => onCellSelect(address)}
                        onDoubleClick={() => console.log(`Double clicked ${address}`)}
                        onChange={(value) => onCellChange(address, value)}
                        onAddressChange={(newAddr) => onAddressChange?.(address, newAddr)}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
