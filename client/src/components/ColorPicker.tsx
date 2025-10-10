import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ColorPickerProps {
  onColorApply: (color: string) => void;
}

const COLORS = [
  { name: "White", value: "#FFFFFF" },
  { name: "Red", value: "#FEE2E2" },
  { name: "Orange", value: "#FFEDD5" },
  { name: "Yellow", value: "#FEF9C3" },
  { name: "Green", value: "#D1FAE5" },
  { name: "Blue", value: "#DBEAFE" },
  { name: "Purple", value: "#E9D5FF" },
  { name: "Pink", value: "#FCE7F3" },
  { name: "Gray", value: "#F3F4F6" },
];

export default function ColorPicker({ onColorApply }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState<string>("");

  const handleApplyColor = () => {
    if (selectedColor) {
      onColorApply(selectedColor);
      setSelectedColor("");
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Cell Color</Label>
      <div className="grid grid-cols-3 gap-2">
        {COLORS.map((color) => (
          <Button
            key={color.value}
            variant={selectedColor === color.value ? "default" : "outline"}
            size="sm"
            className="h-auto p-2 flex flex-col items-center gap-1"
            onClick={() => setSelectedColor(color.value)}
            data-testid={`color-${color.name.toLowerCase()}`}
          >
            <div
              className="w-8 h-8 rounded-sm border border-border"
              style={{ backgroundColor: color.value }}
            />
            <span className="text-xs">{color.name}</span>
          </Button>
        ))}
      </div>
      <div className="flex gap-2">
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={handleApplyColor}
          disabled={!selectedColor}
          data-testid="button-add-color"
        >
          Add Color
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => {
            onColorApply("transparent");
            setSelectedColor("");
          }}
          data-testid="button-remove-color"
        >
          Remove Color
        </Button>
      </div>
    </div>
  );
}
