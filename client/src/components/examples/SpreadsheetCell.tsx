import { useState } from "react";
import SpreadsheetCell from "../SpreadsheetCell";

export default function SpreadsheetCellExample() {
  const [value, setValue] = useState("100");
  const [isSelected, setIsSelected] = useState(false);

  return (
    <SpreadsheetCell
      address="A1"
      value={value}
      isSelected={isSelected}
      onClick={() => setIsSelected(!isSelected)}
      onDoubleClick={() => console.log("Cell double clicked")}
      onChange={setValue}
    />
  );
}
