import { useState } from "react";
import ColorPicker from "../ColorPicker";

export default function ColorPickerExample() {
  const [selectedColor, setSelectedColor] = useState("#DBEAFE");

  return (
    <div className="w-64">
      <ColorPicker
        onColorSelect={(color) => {
          setSelectedColor(color);
          console.log("Selected color:", color);
        }}
        selectedColor={selectedColor}
      />
    </div>
  );
}
