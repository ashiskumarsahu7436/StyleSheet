import { useState } from "react";
import FontControls from "../FontControls";

export default function FontControlsExample() {
  const [fontSize, setFontSize] = useState(14);
  const [fontWeight, setFontWeight] = useState("normal");

  return (
    <div className="w-64">
      <FontControls
        onFontSizeChange={(size) => {
          setFontSize(size);
          console.log("Font size changed to:", size);
        }}
        onFontWeightChange={(weight) => {
          setFontWeight(weight);
          console.log("Font weight changed to:", weight);
        }}
        currentFontSize={fontSize}
        currentFontWeight={fontWeight}
      />
    </div>
  );
}
