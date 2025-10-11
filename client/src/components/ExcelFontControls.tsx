import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bold, Italic, Underline } from "lucide-react";

interface ExcelFontControlsProps {
  onFontSizeChange: (size: number) => void;
  onFontWeightChange: (weight: string) => void;
  onFontFamilyChange: (family: string) => void;
  onItalicToggle: () => void;
  onUnderlineToggle: () => void;
  currentFontSize?: number;
  currentFontWeight?: string;
  currentFontFamily?: string;
  currentFontStyle?: string;
  currentTextDecoration?: string;
}

const FONT_SIZES = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
const FONT_FAMILIES = ["Arial", "Calibri", "Times New Roman", "Verdana", "Georgia"]; // Arial first (Google Sheets default)

export default function ExcelFontControls({
  onFontSizeChange,
  onFontWeightChange,
  onFontFamilyChange,
  onItalicToggle,
  onUnderlineToggle,
  currentFontSize = 10, // Google Sheets default
  currentFontWeight = "normal",
  currentFontFamily = "Arial", // Google Sheets default
  currentFontStyle = "normal",
  currentTextDecoration = "none",
}: ExcelFontControlsProps) {
  const isBold = currentFontWeight === "bold" || currentFontWeight === "700";
  const isItalic = currentFontStyle === "italic";
  const isUnderline = currentTextDecoration === "underline";

  const handleBoldToggle = () => {
    onFontWeightChange(isBold ? "normal" : "bold");
  };

  const handleFontFamilyChange = (family: string) => {
    onFontFamilyChange(family);
  };

  return (
    <div className="flex items-center gap-1 bg-muted/30 px-2 py-1 rounded-md border border-border select-none">
      <Select value={currentFontFamily} onValueChange={handleFontFamilyChange}>
        <SelectTrigger className="w-28 h-7 text-xs border-none bg-transparent" data-testid="select-font-family">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONT_FAMILIES.map((font) => (
            <SelectItem key={font} value={font}>
              {font}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="h-4 w-px bg-border" />

      <Select
        value={currentFontSize.toString()}
        onValueChange={(value) => onFontSizeChange(parseInt(value))}
      >
        <SelectTrigger className="w-14 h-7 text-xs border-none bg-transparent" data-testid="select-font-size">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONT_SIZES.map((size) => (
            <SelectItem key={size} value={size.toString()}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="h-4 w-px bg-border" />

      <Button
        variant={isBold ? "default" : "ghost"}
        size="icon"
        className="h-7 w-7"
        onClick={handleBoldToggle}
        data-testid="button-bold"
      >
        <Bold className="h-3.5 w-3.5" />
      </Button>

      <Button
        variant={isItalic ? "default" : "ghost"}
        size="icon"
        className="h-7 w-7"
        onClick={onItalicToggle}
        data-testid="button-italic"
      >
        <Italic className="h-3.5 w-3.5" />
      </Button>

      <Button
        variant={isUnderline ? "default" : "ghost"}
        size="icon"
        className="h-7 w-7"
        onClick={onUnderlineToggle}
        data-testid="button-underline"
      >
        <Underline className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
