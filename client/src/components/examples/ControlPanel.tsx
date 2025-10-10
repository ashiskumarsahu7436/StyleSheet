import { useState } from "react";
import ControlPanel from "../ControlPanel";

export default function ControlPanelExample() {
  const [selectedCells] = useState(["A1", "B2", "C3"]);
  const [inputValue, setInputValue] = useState("");
  const [outputValue, setOutputValue] = useState("");

  return (
    <div className="h-screen">
      <ControlPanel
        selectedCells={selectedCells}
        onColorApply={(color) => console.log("Color applied:", color)}
        onFontSizeChange={(size) => console.log("Font size:", size)}
        onFontWeightChange={(weight) => console.log("Font weight:", weight)}
        onFormulaApply={(formula) => console.log("Formula applied:", formula)}
        onBulkAdd={(values, sep) => console.log("Bulk add:", values, sep)}
        onUndo={() => console.log("Undo")}
        onRedo={() => console.log("Redo")}
        onSelectAll={() => console.log("Select all")}
        inputValue={inputValue}
        outputValue={outputValue}
        onInputChange={setInputValue}
        onOutputChange={setOutputValue}
        onShowInput={() => setInputValue("A1, B2, C3")}
        onShowOutput={() => setOutputValue("A1, B2, C3")}
      />
    </div>
  );
}
