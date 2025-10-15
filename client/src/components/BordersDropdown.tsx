import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Grid3x3, X } from "lucide-react";
import { useState } from "react";

interface BordersDropdownProps {
  onBorderChange: (type: string, color: string) => void;
}

// Google Sheets color palette
const COLORS = {
  grays: [
    "#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9", "#efefef", "#f3f3f3", "#ffffff"
  ],
  bright: [
    "#980000", "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff", "#ff00ff"
  ],
  pastels1: [
    "#e6b8af", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#c9daf8", "#cfe2f3", "#d9d2e9", "#ead1dc"
  ],
  pastels2: [
    "#dd7e6b", "#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#a4c2f4", "#9fc5e8", "#b4a7d6", "#d5a6bd"
  ],
  medium: [
    "#cc4125", "#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#6d9eeb", "#6fa8dc", "#8e7cc3", "#c27ba0"
  ],
  dark1: [
    "#a61c00", "#cc0000", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3c78d8", "#3d85c6", "#674ea7", "#a64d79"
  ],
  dark2: [
    "#85200c", "#990000", "#b45f06", "#bf9000", "#38761d", "#134f5c", "#1155cc", "#0b5394", "#351c75", "#741b47"
  ],
  dark3: [
    "#5b0f00", "#660000", "#783f04", "#7f6000", "#274e13", "#0c343d", "#1c4587", "#073763", "#20124d", "#4c1130"
  ]
};

const STANDARD_COLORS = [
  "#000000", "#4285f4", "#ea4335", "#fbbc04", "#34a853", "#ff6d01", "#46bdc6"
];

const BORDER_TYPES = [
  { id: "all", label: "All borders", icon: "⊞" },
  { id: "inner", label: "Inner borders", icon: "⊟" },
  { id: "horizontal", label: "Horizontal borders", icon: "≡" },
  { id: "vertical", label: "Vertical borders", icon: "|||" },
  { id: "outer", label: "Outer borders", icon: "□" },
  { id: "left", label: "Left border", icon: "⌈" },
  { id: "right", label: "Right border", icon: "⌉" },
  { id: "top", label: "Top border", icon: "⌊" },
  { id: "bottom", label: "Bottom border", icon: "⌋" },
  { id: "clear", label: "Clear borders", icon: "✕" },
];

export default function BordersDropdown({ onBorderChange }: BordersDropdownProps) {
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [open, setOpen] = useState(false);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  const handleBorderType = (type: string) => {
    onBorderChange(type, selectedColor);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Borders" data-testid="button-borders">
          <Grid3x3 className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="p-3 space-y-3">
          {/* Border Type Selector */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground mb-2">Border style</div>
            <div className="grid grid-cols-2 gap-1">
              {BORDER_TYPES.map((type) => (
                <Button
                  key={type.id}
                  variant="ghost"
                  size="sm"
                  className="justify-start h-8 text-xs font-normal"
                  onClick={() => handleBorderType(type.id)}
                  data-testid={`border-${type.id}`}
                >
                  <span className="mr-2 text-base">{type.icon}</span>
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Color Reset */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start h-8 text-xs"
            onClick={() => setSelectedColor("#000000")}
            data-testid="border-color-reset"
          >
            <X className="h-3.5 w-3.5 mr-2" />
            Reset color
          </Button>

          {/* Color Palette */}
          <div className="space-y-2">
            {/* All color rows */}
            {[COLORS.grays, COLORS.bright, COLORS.pastels1, COLORS.pastels2, COLORS.medium, COLORS.dark1, COLORS.dark2, COLORS.dark3].map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1">
                {row.map((color) => (
                  <button
                    key={color}
                    className="w-5 h-5 rounded-sm border border-border hover:scale-110 transition-transform relative"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                    title={color}
                    data-testid={`border-color-${color}`}
                  >
                    {selectedColor === color && (
                      <div className="absolute inset-0 border-2 border-blue-500 rounded-sm" />
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="h-px bg-border" />

          {/* Standard Colors */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">STANDARD</div>
            <div className="flex gap-1">
              {STANDARD_COLORS.map((color) => (
                <button
                  key={color}
                  className="w-7 h-7 rounded-full border border-border hover:scale-110 transition-transform relative"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                  title={color}
                  data-testid={`border-standard-${color}`}
                >
                  {selectedColor === color && (
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Color Display */}
          <div className="flex items-center gap-2 pt-2">
            <div className="text-xs text-muted-foreground">Selected:</div>
            <div 
              className="w-6 h-6 rounded border border-border"
              style={{ backgroundColor: selectedColor }}
            />
            <div className="text-xs font-mono">{selectedColor}</div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
