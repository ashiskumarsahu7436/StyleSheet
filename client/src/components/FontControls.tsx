import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FontControlsProps {
  onFontSizeChange: (size: number) => void;
  onFontWeightChange: (weight: string) => void;
  currentFontSize?: number;
  currentFontWeight?: string;
}

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24];
const FONT_WEIGHTS = [
  { label: "Normal", value: "normal" },
  { label: "Medium", value: "500" },
  { label: "Bold", value: "bold" },
];

export default function FontControls({
  onFontSizeChange,
  onFontWeightChange,
  currentFontSize = 14,
  currentFontWeight = "normal",
}: FontControlsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Font Size</Label>
        <Select
          value={currentFontSize.toString()}
          onValueChange={(value) => onFontSizeChange(parseInt(value))}
        >
          <SelectTrigger data-testid="select-font-size">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZES.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}px
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Font Weight</Label>
        <Select value={currentFontWeight} onValueChange={onFontWeightChange}>
          <SelectTrigger data-testid="select-font-weight">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_WEIGHTS.map((weight) => (
              <SelectItem key={weight.value} value={weight.value}>
                {weight.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
