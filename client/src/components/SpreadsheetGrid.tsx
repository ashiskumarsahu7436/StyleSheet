import { useState, useRef } from "react";
import SpreadsheetCell from "./SpreadsheetCell";

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
  mergedCells?: MergedCell[];
  onDeleteRow?: (rowIndex: number) => void;
  onInsertRow?: (rowIndex: number) => void;
  onDeleteColumn?: (colIndex: number) => void;
  onInsertColumn?: (colIndex: number) => void;
  defaultFormatting?: {
    fontSize?: number;
    fontWeight?: string;
    fontFamily?: string;
    fontStyle?: string;
    textDecoration?: string;
    backgroundColor?: string;
  };
  editingCell?: string | null;
  onEditingCellChange?: (cell: string | null) => void;
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
  mergedCells = [],
  onDeleteRow,
  onInsertRow,
  onDeleteColumn,
  onInsertColumn,
  defaultFormatting = {},
  editingCell = null,
  onEditingCellChange,
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

  const getColumnIndexFromLabel = (label: string): number => {
    let index = 0;
    for (let i = 0; i < label.length; i++) {
      index = index * 26 + (label.charCodeAt(i) - 65 + 1);
    }
    return index - 1;
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
      const currentWidth = columnWidths.get(resizingCol) || 32;
      const newWidth = Math.max(32, currentWidth + deltaX);
      onColumnResize(resizingCol, newWidth);
      startPosRef.current = { x: e.clientX, y: e.clientY };
    } else if (resizingRow !== null && onRowResize) {
      const deltaY = e.clientY - startPosRef.current.y;
      const currentHeight = rowHeights.get(resizingRow) || 10.5;
      const newHeight = Math.max(10.5, currentHeight + deltaY);
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
      const startRowMatch = dragStart.match(/\d+/)?.[0];
      const startColMatch = dragStart.match(/^[A-Z]+/)?.[0];
      const endRowMatch = address.match(/\d+/)?.[0];
      const endColMatch = address.match(/^[A-Z]+/)?.[0];
      
      if (!startRowMatch || !startColMatch || !endRowMatch || !endColMatch) return;
      
      const startRow = parseInt(startRowMatch) - 1;
      const startCol = getColumnIndexFromLabel(startColMatch);
      const endRow = parseInt(endRowMatch) - 1;
      const endCol = getColumnIndexFromLabel(endColMatch);

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

  const getCellRowCol = (addr: string) => {
    const match = addr.match(/^([A-Z]+)(\d+)/);
    if (!match) return { row: 0, col: 0 };
    const colLabel = match[1];
    const row = parseInt(match[2]) - 1;
    let col = 0;
    for (let i = 0; i < colLabel.length; i++) {
      col = col * 26 + (colLabel.charCodeAt(i) - 65 + 1);
    }
    return { row, col: col - 1 };
  };

  const getMergedCellInfo = (address: string) => {
    const merged = mergedCells.find(m => {
      const start = getCellRowCol(m.startAddress);
      const current = getCellRowCol(address);
      return current.row === start.row && current.col === start.col;
    });
    if (merged) return merged;
    
    const hiddenIn = mergedCells.find(m => {
      const start = getCellRowCol(m.startAddress);
      const current = getCellRowCol(address);
      
      return current.row >= start.row && 
             current.row < start.row + m.rowspan &&
             current.col >= start.col && 
             current.col < start.col + m.colspan &&
             !(current.row === start.row && current.col === start.col);
    });
    
    return hiddenIn ? { ...hiddenIn, isHidden: true } : null;
  };

  return (
    <div className="h-full w-full overflow-auto">
      <div
        className="p-4"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <table className="border-collapse border border-border" style={{ tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}>
          <colgroup>
            <col style={{ width: '48px' }} />
            {Array.from({ length: cols }).map((_, colIndex) => {
              const width = columnWidths.get(colIndex) || 64; // Compact default like Google Sheets
              return <col key={colIndex} style={{ width: `${width}px` }} />;
            })}
          </colgroup>
          <thead>
            <tr>
              <th className="bg-card border-r border-b border-border sticky left-0 top-0 z-20" />
              {Array.from({ length: cols }).map((_, colIndex) => (
                <th
                  key={colIndex}
                  className="relative bg-card border-r border-b border-border font-semibold text-sm sticky top-0 z-10 hover-elevate cursor-pointer h-8"
                  onClick={() => onColumnSelect(colIndex)}
                  data-testid={`header-col-${getColumnLabel(colIndex)}`}
                >
                  {getColumnLabel(colIndex)}
                  {/* Delete Column Button */}
                  {onDeleteColumn && (
                    <button
                      className="absolute left-0 top-0 w-3 h-3 text-[8px] flex items-center justify-center bg-muted/40 text-muted-foreground opacity-60 hover:opacity-100 hover:bg-red-500 hover:text-white transition-all z-20"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteColumn(colIndex);
                      }}
                      title="Delete column"
                      data-testid={`button-delete-col-${colIndex}`}
                    >
                      ×
                    </button>
                  )}
                  {/* Insert Column Button */}
                  {onInsertColumn && (
                    <button
                      className="absolute right-0 top-0 w-3 h-3 text-[8px] flex items-center justify-center bg-muted/40 text-muted-foreground opacity-60 hover:opacity-100 hover:bg-green-500 hover:text-white transition-all z-20"
                      onClick={(e) => {
                        e.stopPropagation();
                        onInsertColumn(colIndex);
                      }}
                      title="Insert column"
                      data-testid={`button-insert-col-${colIndex}`}
                    >
                      +
                    </button>
                  )}
                  <div
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-primary z-10 transition-colors"
                    onMouseDown={(e) => handleColumnBorderMouseDown(e, colIndex)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => {
              const height = rowHeights.get(rowIndex) || 21; // Google Sheets default
              return (
                <tr key={rowIndex} style={{ height: `${height}px` }}>
                  <th
                    className="relative bg-card border-r border-b border-border text-sm font-medium sticky left-0 z-10 hover-elevate cursor-pointer"
                    onClick={() => onRowSelect(rowIndex)}
                    data-testid={`header-row-${rowIndex + 1}`}
                  >
                    {rowIndex + 1}
                    {/* Delete Row Button */}
                    {onDeleteRow && (
                      <button
                        className="absolute left-0 top-0 w-3 h-3 text-[8px] flex items-center justify-center bg-muted/40 text-muted-foreground opacity-60 hover:opacity-100 hover:bg-red-500 hover:text-white transition-all z-20"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRow(rowIndex);
                        }}
                        title="Delete row"
                        data-testid={`button-delete-row-${rowIndex}`}
                      >
                        ×
                      </button>
                    )}
                    {/* Insert Row Button */}
                    {onInsertRow && (
                      <button
                        className="absolute right-0 top-0 w-3 h-3 text-[8px] flex items-center justify-center bg-muted/40 text-muted-foreground opacity-60 hover:opacity-100 hover:bg-green-500 hover:text-white transition-all z-20"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInsertRow(rowIndex);
                        }}
                        title="Insert row"
                        data-testid={`button-insert-row-${rowIndex}`}
                      >
                        +
                      </button>
                    )}
                    <div
                      className="absolute bottom-0 left-0 w-full h-2 cursor-row-resize hover:bg-primary z-10 transition-colors"
                      onMouseDown={(e) => handleRowBorderMouseDown(e, rowIndex)}
                    />
                  </th>
                  {Array.from({ length: cols }).map((_, colIndex) => {
                    const address = getCellAddress(rowIndex, colIndex);
                    const mergeInfo = getMergedCellInfo(address);
                    
                    if (mergeInfo && (mergeInfo as any).isHidden) {
                      return null;
                    }
                    
                    let cell = cellData.get(address);
                    
                    if (!cell && mergeInfo && !((mergeInfo as any).isHidden)) {
                      cell = cellData.get(mergeInfo.startAddress);
                    }
                    
                    if (!cell) {
                      cell = {
                        address,
                        value: "",
                        // Don't set defaults here - let them come from defaultFormatting prop
                      };
                    }
                    
                    let displayAddress = cell.address;
                    if (mergeInfo && !((mergeInfo as any).isHidden) && (mergeInfo.colspan > 1 || mergeInfo.rowspan > 1)) {
                      displayAddress = `${mergeInfo.startAddress}:${mergeInfo.endAddress}`;
                    }
                    
                    const isSelected = selectedCells.includes(address) || selectedCells.includes(cell.address);
                    const isTemporary = temporarySelectedCells.includes(address);
                    
                    const colspan = mergeInfo && !((mergeInfo as any).isHidden) ? mergeInfo.colspan : 1;
                    const rowspan = mergeInfo && !((mergeInfo as any).isHidden) ? mergeInfo.rowspan : 1;
                    
                    let cellHeight = rowHeights.get(rowIndex) || 21;
                    if (rowspan > 1) {
                      cellHeight = 0;
                      for (let i = 0; i < rowspan; i++) {
                        cellHeight += rowHeights.get(rowIndex + i) || 21;
                      }
                    }
                    
                    return (
                      <td
                        key={address}
                        colSpan={colspan}
                        rowSpan={rowspan}
                        className="border border-border p-0 relative"
                        style={{ height: `${cellHeight}px` }}
                        onMouseDown={() => handleCellMouseDown(address)}
                        onMouseEnter={() => handleCellMouseEnter(address)}
                        onMouseUp={handleCellMouseUp}
                      >
                        <SpreadsheetCell
                          address={displayAddress}
                          value={cell.value}
                          isSelected={isSelected}
                          isTemporary={isTemporary}
                          backgroundColor={cell.backgroundColor ?? defaultFormatting.backgroundColor}
                          fontSize={cell.fontSize ?? defaultFormatting.fontSize}
                          fontWeight={cell.fontWeight ?? defaultFormatting.fontWeight}
                          fontFamily={cell.fontFamily ?? defaultFormatting.fontFamily}
                          fontStyle={cell.fontStyle ?? defaultFormatting.fontStyle}
                          textDecoration={cell.textDecoration ?? defaultFormatting.textDecoration}
                          isEditing={editingCell === cell.address}
                          onClick={() => onCellSelect(cell.address)}
                          onDoubleClick={() => onEditingCellChange?.(cell.address)}
                          onChange={(value) => onCellChange(cell.address, value)}
                          onAddressChange={(newAddr) => onAddressChange?.(cell.address, newAddr)}
                          onEnterEditMode={() => onEditingCellChange?.(cell.address)}
                          onExitEditMode={() => onEditingCellChange?.(null)}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
