import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import ColorPicker from "./ColorPicker";
import FontControls from "./FontControls";
import InputOutputSection from "./InputOutputSection";
import FormulaSection from "./FormulaSection";
import BulkValueSection from "./BulkValueSection";
import { Undo2, Redo2, MousePointer2, Check } from "lucide-react";

interface ControlPanelProps {
  selectedCells: string[];
  temporarySelectedCells?: string[];
  onMakePermanent?: () => void;
  onColorApply: (color: string) => void;
  onFontSizeChange: (size: number) => void;
  onFontWeightChange: (weight: string) => void;
  onFormulaApply: (formula: string) => void;
  customFormulas?: Array<{ name: string; logic: string }>;
  onAddCustomFormula?: (name: string, logic: string) => void;
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
  temporarySelectedCells = [],
  onMakePermanent,
  onColorApply,
  onFontSizeChange,
  onFontWeightChange,
  onFormulaApply,
  customFormulas,
  onAddCustomFormula,
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
    <div className="w-full h-full border-l border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-lg">Controls</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {selectedCells.length} cell{selectedCells.length !== 1 ? "s" : ""} selected
        </p>
        {temporarySelectedCells.length > 0 && (
          <p className="text-sm text-chart-2 mt-1">
            {temporarySelectedCells.length} temporary (5s)
          </p>
        )}
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

          {temporarySelectedCells.length > 0 && onMakePermanent && (
            <Button
              variant="default"
              size="sm"
              className="w-full gap-2"
              onClick={onMakePermanent}
              data-testid="button-make-permanent"
            >
              <Check className="w-4 h-4" />
              Select (Make Permanent)
            </Button>
          )}

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

          <ColorPicker onColorApply={onColorApply} />

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

          <FormulaSection 
            onFormulaApply={onFormulaApply}
            customFormulas={customFormulas}
            onAddCustomFormula={onAddCustomFormula}
          />

          <Separator />

          <BulkValueSection onBulkAdd={onBulkAdd} />
        </div>
      </ScrollArea>
    </div>
  );
}
