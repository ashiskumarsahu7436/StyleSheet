import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search,
  Undo2, 
  Redo2, 
  Printer,
  Paintbrush,
  DollarSign,
  Percent,
  Hash,
  Bold, 
  Italic, 
  Underline,
  Palette,
  Grid3x3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  WrapText,
  RotateCw,
  MoreVertical,
  History,
  Star,
  Folder,
  Cloud,
  Minus,
  Plus,
  Download,
  Table2,
  ChevronDown,
  SlidersHorizontal
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import BordersDropdown from "@/components/BordersDropdown";

interface GoogleSheetsToolbarProps {
  spreadsheetName: string;
  onSpreadsheetNameChange: (name: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onFontFamilyChange: (family: string) => void;
  onFontSizeChange: (size: number) => void;
  onBoldToggle: () => void;
  onItalicToggle: () => void;
  onUnderlineToggle: () => void;
  onColorApply: (color: string) => void;
  onBorderChange: (type: string, color: string) => void;
  currentFontFamily?: string;
  currentFontSize?: number;
  currentFontWeight?: string;
  currentFontStyle?: string;
  currentTextDecoration?: string;
  canUndo?: boolean;
  canRedo?: boolean;
  onDownload: () => void;
  isComplexMode: boolean;
  onModeToggle: () => void;
  onMergeCells: (type?: 'all' | 'vertical' | 'horizontal') => void;
  onUnmergeCells: () => void;
  isMergedCell?: boolean;
}

const FONT_SIZES = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
const FONT_FAMILIES = ["Arial", "Calibri", "Times New Roman", "Verdana", "Georgia", "Courier New"];

const MENU_ITEMS = ["File", "Edit", "View", "Insert", "Format", "Data", "Tools", "Extensions", "Help"];

const COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#B7B7B7", "#CCCCCC", "#D9D9D9", "#EFEFEF", "#F3F3F3", "#FFFFFF",
  "#980000", "#FF0000", "#FF9900", "#FFFF00", "#00FF00", "#00FFFF", "#4A86E8", "#0000FF", "#9900FF", "#FF00FF",
];

export default function GoogleSheetsToolbar({
  spreadsheetName,
  onSpreadsheetNameChange,
  onUndo,
  onRedo,
  onFontFamilyChange,
  onFontSizeChange,
  onBoldToggle,
  onItalicToggle,
  onUnderlineToggle,
  onColorApply,
  onBorderChange,
  currentFontFamily = "Arial",
  currentFontSize = 10,
  currentFontWeight = "normal",
  currentFontStyle = "normal",
  currentTextDecoration = "none",
  canUndo = false,
  canRedo = false,
  onDownload,
  isComplexMode,
  onModeToggle,
  onMergeCells,
  onUnmergeCells,
  isMergedCell = false,
}: GoogleSheetsToolbarProps) {
  const isBold = currentFontWeight === "bold" || currentFontWeight === "700";
  const isItalic = currentFontStyle === "italic";
  const isUnderline = currentTextDecoration === "underline";

  return (
    <div className="border-b border-border bg-background">
      {/* First Line - Title, Menu Bar, and Actions */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        {/* Left side - StyleSheet Title */}
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl font-bold tracking-tight">StyleSheet</h1>
          <span className="text-xs text-muted-foreground font-light">An Excel-like spreadsheet builder</span>
        </div>
        
        {/* Right side - Input Box + Icons */}
        <div className="flex items-center gap-3">
          {/* Spreadsheet Name Input Box */}
          <input
            type="text"
            value={spreadsheetName}
            onChange={(e) => onSpreadsheetNameChange(e.target.value)}
            className="text-sm font-normal bg-background border border-border px-3 py-1.5 rounded outline-none focus:border-primary w-56"
            placeholder="My Spreadsheet"
            data-testid="input-spreadsheet-name"
          />
          
          {/* Icons */}
          <Star className="h-4 w-4 text-muted-foreground" />
          <Folder className="h-4 w-4 text-muted-foreground" />
          <Cloud className="h-4 w-4 text-muted-foreground" />
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Version history">
            <History className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </div>

      {/* Menu Bar */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-border text-sm">
        {/* Left side - Menu Items */}
        <div className="flex items-center gap-1">
          {MENU_ITEMS.map((item) => (
            <Button
              key={item}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs font-normal"
              data-testid={`menu-${item.toLowerCase()}`}
            >
              {item}
            </Button>
          ))}
        </div>

        {/* Right side - Download and Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-3 gap-1.5 text-xs"
            onClick={onDownload}
            title="Download spreadsheet"
            data-testid="button-download-menu"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
          <Button
            variant={isComplexMode ? "default" : "outline"}
            size="sm"
            className="h-7 w-32 px-3 gap-1.5 text-xs"
            onClick={onModeToggle}
            title={isComplexMode ? "Switch to Simple Mode" : "Switch to Complex Mode"}
            data-testid="button-mode-toggle"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {isComplexMode ? "Complex Mode" : "Simple Mode"}
          </Button>
        </div>
      </div>

      {/* Toolbar - All Icons */}
      <div className="flex items-center gap-0.5 px-2 py-1 overflow-x-auto select-none bg-muted/30">
        {/* Search - Always visible */}
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Search">
          <Search className="h-3.5 w-3.5" />
        </Button>

        {/* Undo/Redo - Always visible */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          data-testid="button-undo"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          data-testid="button-redo"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </Button>

        {/* Print - Always visible */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => window.print()}
          title="Print (Ctrl+P)"
          data-testid="button-print"
        >
          <Printer className="h-3.5 w-3.5" />
        </Button>

        {/* Complex Mode Only - Paint Format, Zoom and Number Formatting */}
        {isComplexMode && (
          <>
            {/* Paint Format */}
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Paint format">
              <Paintbrush className="h-3.5 w-3.5" />
            </Button>

            {/* Zoom */}
            <Select defaultValue="100">
              <SelectTrigger className="w-16 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50%</SelectItem>
                <SelectItem value="75">75%</SelectItem>
                <SelectItem value="100">100%</SelectItem>
                <SelectItem value="125">125%</SelectItem>
                <SelectItem value="150">150%</SelectItem>
              </SelectContent>
            </Select>

            <div className="h-5 w-px bg-border mx-1" />

            {/* Currency, Percent, Number Format */}
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Format as currency">
              <DollarSign className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Format as percent">
              <Percent className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Decrease decimal places">
              <span className="text-xs font-mono">.0</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Increase decimal places">
              <span className="text-xs font-mono">0.</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="More formats">
              <Hash className="h-3.5 w-3.5" />
            </Button>

            <div className="h-5 w-px bg-border mx-1" />
          </>
        )}

        {/* Font Family - Always visible */}
        <Select value={currentFontFamily} onValueChange={onFontFamilyChange}>
          <SelectTrigger className="w-28 h-7 text-xs" data-testid="select-font-family">
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

        {/* Font Size with +/- buttons - Always visible */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-6"
            onClick={() => onFontSizeChange(Math.max(8, currentFontSize - 1))}
            title="Decrease font size"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Select
            value={currentFontSize.toString()}
            onValueChange={(value) => onFontSizeChange(parseInt(value))}
          >
            <SelectTrigger className="w-16 h-7 text-xs px-2" data-testid="select-font-size">
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
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-6"
            onClick={() => onFontSizeChange(Math.min(72, currentFontSize + 1))}
            title="Increase font size"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <div className="h-5 w-px bg-border mx-1" />

        {/* Text Formatting: Bold, Italic, Underline */}
        <Button
          variant={isBold ? "default" : "ghost"}
          size="icon"
          className="h-7 w-7"
          onClick={onBoldToggle}
          title="Bold (Ctrl+B)"
          data-testid="button-bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant={isItalic ? "default" : "ghost"}
          size="icon"
          className="h-7 w-7"
          onClick={onItalicToggle}
          title="Italic (Ctrl+I)"
          data-testid="button-italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant={isUnderline ? "default" : "ghost"}
          size="icon"
          className="h-7 w-7"
          onClick={onUnderlineToggle}
          title="Underline (Ctrl+U)"
          data-testid="button-underline"
        >
          <Underline className="h-3.5 w-3.5" />
        </Button>

        {/* Text Color */}
        <div className="relative">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Text color">
            <span className="text-sm font-bold underline decoration-2" style={{ textDecorationColor: '#000' }}>A</span>
          </Button>
        </div>

        {/* Fill Color with Palette - Always visible */}
        <div className="relative group">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Fill color">
            <Palette className="h-3.5 w-3.5" />
          </Button>
          {/* Color palette */}
          <div className="absolute hidden group-hover:grid grid-cols-10 gap-1 p-2 bg-background border border-border rounded shadow-lg top-full left-0 z-10 mt-1">
            {COLORS.map((color, idx) => (
              <button
                key={idx}
                className="h-5 w-5 rounded border border-border hover-elevate cursor-pointer"
                style={{ backgroundColor: color }}
                onClick={() => onColorApply(color)}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Borders - Always visible */}
        <div className="h-5 w-px bg-border mx-1" />
        <BordersDropdown onBorderChange={onBorderChange} />

        {/* Merge cells - Always visible (Google Sheets style with separate buttons) */}
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-7 w-7 rounded-r-none" 
            title={isMergedCell ? "Unmerge cells" : "Merge cells"}
            onClick={isMergedCell ? onUnmergeCells : () => onMergeCells('all')}
            data-testid="button-merge-toggle"
          >
            <Table2 className="h-3.5 w-3.5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-7 w-5 rounded-l-none border-l border-border/50 px-0" 
                title="Merge type"
                data-testid="button-merge-dropdown"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => onMergeCells('all')} data-testid="merge-all">
                Merge all
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMergeCells('vertical')} data-testid="merge-vertically">
                Merge vertically
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMergeCells('horizontal')} data-testid="merge-horizontally">
                Merge horizontally
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onUnmergeCells} data-testid="unmerge">
                Unmerge
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Complex Mode Only - Alignment buttons (Screenshot 1) */}
        {isComplexMode && (
          <>
            <div className="h-5 w-px bg-border mx-1" />

            {/* Horizontal Alignment */}
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Horizontal align">
              <AlignLeft className="h-3.5 w-3.5" />
            </Button>

            {/* Vertical Alignment */}
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Vertical align">
              <AlignVerticalJustifyCenter className="h-3.5 w-3.5" />
            </Button>

            {/* Text wrapping */}
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Text wrapping">
              <WrapText className="h-3.5 w-3.5" />
            </Button>

            {/* Text rotation */}
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Text rotation">
              <RotateCw className="h-3.5 w-3.5" />
            </Button>

            <div className="h-5 w-px bg-border mx-1" />

            {/* More options */}
            <Button variant="ghost" size="icon" className="h-7 w-7" title="More options">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
