import { useState } from "react";
import SpreadsheetGrid from "../SpreadsheetGrid";

export default function SpreadsheetGridExample() {
  const [selectedCells, setSelectedCells] = useState<string[]>(["A1", "B2"]);
  const [cellData] = useState(
    new Map([
      ["A1", { address: "A1", value: "100", backgroundColor: "transparent" }],
      ["B2", { address: "B2", value: "200", backgroundColor: "transparent" }],
    ])
  );

  const handleCellSelect = (address: string) => {
    setSelectedCells((prev) =>
      prev.includes(address)
        ? prev.filter((a) => a !== address)
        : [...prev, address]
    );
  };

  const handleCellChange = (address: string, value: string) => {
    console.log(`Cell ${address} changed to:`, value);
  };

  return (
    <div className="h-96">
      <SpreadsheetGrid
        rows={20}
        cols={10}
        selectedCells={selectedCells}
        onCellSelect={handleCellSelect}
        cellData={cellData}
        onCellChange={handleCellChange}
      />
    </div>
  );
}
