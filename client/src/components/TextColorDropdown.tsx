import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

interface TextColorDropdownProps {
  onColorApply: (color: string) => void;
}

// Google Sheets exact color palette
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

export default function TextColorDropdown({ onColorApply }: TextColorDropdownProps) {
  const [open, setOpen] = useState(false);

  const handleColorClick = (color: string) => {
    onColorApply(color);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Text color" data-testid="button-text-color">
          <span className="text-sm font-bold underline decoration-2" style={{ textDecorationColor: '#000' }}>A</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="p-3 space-y-3">
          {/* Reset button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start h-8 text-xs font-normal"
            onClick={() => handleColorClick("#000000")}
            data-testid="text-color-reset"
          >
            <div className="mr-2 h-4 w-4 rounded-full border border-border relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-px bg-red-500 rotate-45" />
              </div>
            </div>
            Reset
          </Button>

          <div className="h-px bg-border" />

          {/* Color palette - 8 rows of 10 colors */}
          <div className="space-y-1">
            {[COLORS.grays, COLORS.bright, COLORS.pastels1, COLORS.pastels2, COLORS.medium, COLORS.dark1, COLORS.dark2, COLORS.dark3].map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1">
                {row.map((color) => (
                  <button
                    key={color}
                    className="w-5 h-5 rounded-sm border border-border hover:scale-110 transition-transform relative"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorClick(color)}
                    title={color}
                    data-testid={`text-color-${color}`}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="h-px bg-border" />

          {/* Standard colors */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">STANDARD</div>
            <div className="flex gap-1">
              {STANDARD_COLORS.map((color) => (
                <button
                  key={color}
                  className="w-7 h-7 rounded-full border border-border hover:scale-110 transition-transform relative"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorClick(color)}
                  title={color}
                  data-testid={`text-standard-${color}`}
                />
              ))}
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Custom color */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">CUSTOM</div>
            <div className="flex items-center gap-2">
              <button className="w-6 h-6 rounded-full border-2 border-border hover:scale-110 transition-transform bg-background flex items-center justify-center">
                <div className="w-4 h-4 rounded-full border border-dashed border-muted-foreground" />
              </button>
              <input
                type="color"
                className="opacity-0 absolute w-0 h-0"
                onChange={(e) => handleColorClick(e.target.value)}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
