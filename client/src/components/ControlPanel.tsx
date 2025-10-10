import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import ColorPicker from "./ColorPicker";
import FontControls from "./FontControls";
import InputOutputSection from "./InputOutputSection";
import FormulaSection from "./FormulaSection";
import BulkValueSection from "./BulkValueSection";
import { Undo2, Redo2, MousePointer2 } from "lucide-react";

interface ControlPanelProps {
  selectedCells: string[];
  onColorSelect: (color: string) => void;
  onFontSizeChange: (size: number) => void;
  onFontWeightChange: (weight: string) => void;
  onFormulaApply: (formula: string) => void;
  onBulkAdd: (values: string[], separator: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSelectAll: () => void;
  inputValue: string;
  outputValue: string;
  onInputChange: (value: string) => void;
  onOutputChange: (value: string) => void;
  onShowInput: () => void;
  onShowOutput: () => void;
}

export default function ControlPanel({
  selectedCells,
  onColorSelect,
  onFontSizeChange,
  onFontWeightChange,
  onFormulaApply,
  onBulkAdd,
  onUndo,
  onRedo,
  onSelectAll,
  inputValue,
  outputValue,
  onInputChange,
  onOutputChange,
  onShowInput,
  onShowOutput,
}: ControlPanelProps) {
  return (
    <div className="w-96 h-full border-l border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-lg">Controls</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {selectedCells.length} cell{selectedCells.length !== 1 ? "s" : ""} selected
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={onUndo}
              data-testid="button-undo"
            >
              <Undo2 className="w-4 h-4" />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={onRedo}
              data-testid="button-redo"
            >
              <Redo2 className="w-4 h-4" />
              Redo
            </Button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="w-full gap-2"
            onClick={onSelectAll}
            data-testid="button-select-all"
          >
            <MousePointer2 className="w-4 h-4" />
            Select All
          </Button>

          <Separator />

          <ColorPicker onColorSelect={onColorSelect} />

          <Separator />

          <FontControls
            onFontSizeChange={onFontSizeChange}
            onFontWeightChange={onFontWeightChange}
          />

          <Separator />

          <InputOutputSection
            inputValue={inputValue}
            outputValue={outputValue}
            onInputChange={onInputChange}
            onOutputChange={onOutputChange}
            onShowInput={onShowInput}
            onShowOutput={onShowOutput}
          />

          <Separator />

          <FormulaSection onFormulaApply={onFormulaApply} />

          <Separator />

          <BulkValueSection onBulkAdd={onBulkAdd} />
        </div>
      </ScrollArea>
    </div>
  );
}
