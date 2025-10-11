import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Undo2, 
  Redo2, 
  Printer, 
  Bold, 
  Italic, 
  Underline,
  MergeIcon,
  Split,
  Download
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

interface GoogleSheetsToolbarProps {
  spreadsheetName: string;
  onSpreadsheetNameChange: (name: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDownload: () => void;
  onFontFamilyChange: (family: string) => void;
  onFontSizeChange: (size: number) => void;
  onBoldToggle: () => void;
  onItalicToggle: () => void;
  onUnderlineToggle: () => void;
  onColorApply: (color: string) => void;
  onMergeCells: () => void;
  onUnmergeCells: () => void;
  currentFontFamily?: string;
  currentFontSize?: number;
  currentFontWeight?: string;
  currentFontStyle?: string;
  currentTextDecoration?: string;
  canUndo?: boolean;
  canRedo?: boolean;
}

const FONT_SIZES = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
const FONT_FAMILIES = ["Arial", "Calibri", "Times New Roman", "Verdana", "Georgia", "Courier New"];

const COLORS = [
  { name: "White", value: "#FFFFFF" },
  { name: "Red", value: "#FF6B6B" },
  { name: "Orange", value: "#FFA500" },
  { name: "Yellow", value: "#FFD93D" },
  { name: "Green", value: "#6BCF7F" },
  { name: "Blue", value: "#4D96FF" },
  { name: "Purple", value: "#C77DFF" },
  { name: "Pink", value: "#FFB5E8" },
  { name: "Gray", value: "#E5E5E5" },
];

export default function GoogleSheetsToolbar({
  spreadsheetName,
  onSpreadsheetNameChange,
  onUndo,
  onRedo,
  onDownload,
  onFontFamilyChange,
  onFontSizeChange,
  onBoldToggle,
  onItalicToggle,
  onUnderlineToggle,
  onColorApply,
  onMergeCells,
  onUnmergeCells,
  currentFontFamily = "Arial",
  currentFontSize = 10,
  currentFontWeight = "normal",
  currentFontStyle = "normal",
  currentTextDecoration = "none",
  canUndo = false,
  canRedo = false,
}: GoogleSheetsToolbarProps) {
  const isBold = currentFontWeight === "bold" || currentFontWeight === "700";
  const isItalic = currentFontStyle === "italic";
  const isUnderline = currentTextDecoration === "underline";

  return (
    <div className="border-b border-border bg-background">
      {/* Top Row - Document Name and Menu */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">StyleSheet</h1>
          <Input
            value={spreadsheetName}
            onChange={(e) => onSpreadsheetNameChange(e.target.value)}
            className="w-60 h-8 text-sm"
            placeholder="Spreadsheet name"
            data-testid="input-spreadsheet-name"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDownload}
            data-testid="button-download"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <ThemeToggle />
        </div>
      </div>

      {/* Toolbar Row - All Controls */}
      <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto select-none">
        {/* Undo/Redo Group */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onUndo}
            disabled={!canUndo}
            data-testid="button-undo"
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onRedo}
            disabled={!canRedo}
            data-testid="button-redo"
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => window.print()}
            data-testid="button-print"
            title="Print"
          >
            <Printer className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border mx-1" />

        {/* Font Family */}
        <Select value={currentFontFamily} onValueChange={onFontFamilyChange}>
          <SelectTrigger className="w-32 h-8 text-xs" data-testid="select-font-family">
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

        {/* Font Size */}
        <Select
          value={currentFontSize.toString()}
          onValueChange={(value) => onFontSizeChange(parseInt(value))}
        >
          <SelectTrigger className="w-16 h-8 text-xs" data-testid="select-font-size">
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

        <div className="h-6 w-px bg-border mx-1" />

        {/* Text Formatting */}
        <div className="flex items-center gap-0.5">
          <Button
            variant={isBold ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={onBoldToggle}
            data-testid="button-bold"
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={isItalic ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={onItalicToggle}
            data-testid="button-italic"
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={isUnderline ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={onUnderlineToggle}
            data-testid="button-underline"
            title="Underline (Ctrl+U)"
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border mx-1" />

        {/* Colors */}
        <div className="flex items-center gap-1">
          {COLORS.map((color) => (
            <button
              key={color.name}
              className="h-6 w-6 rounded border border-border hover-elevate active-elevate-2 cursor-pointer"
              style={{ backgroundColor: color.value }}
              onClick={() => onColorApply(color.value)}
              data-testid={`button-color-${color.name.toLowerCase()}`}
              title={color.name}
            />
          ))}
        </div>

        <div className="h-6 w-px bg-border mx-1" />

        {/* Merge Cells */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onMergeCells}
            title="Merge cells"
            data-testid="button-merge"
          >
            <MergeIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onUnmergeCells}
            title="Unmerge cells"
            data-testid="button-unmerge"
          >
            <Split className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
