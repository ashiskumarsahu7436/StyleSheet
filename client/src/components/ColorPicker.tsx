import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ColorPickerProps {
  onColorSelect: (color: string) => void;
  selectedColor?: string;
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

export default function ColorPicker({ onColorSelect, selectedColor }: ColorPickerProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Cell Color</Label>
      <div className="grid grid-cols-3 gap-2">
        {COLORS.map((color) => (
          <Button
            key={color.value}
            variant="outline"
            size="sm"
            className="h-auto p-2 flex flex-col items-center gap-1"
            onClick={() => onColorSelect(color.value)}
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
      <Button
        variant="secondary"
        size="sm"
        className="w-full"
        onClick={() => onColorSelect("transparent")}
        data-testid="button-remove-color"
      >
        Remove Color
      </Button>
    </div>
  );
}
