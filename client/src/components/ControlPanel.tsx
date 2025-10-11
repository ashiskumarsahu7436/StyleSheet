import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import ColorPicker from "./ColorPicker";
import InputOutputSection from "./InputOutputSection";
import FormulaSection from "./FormulaSection";
import BulkValueSection from "./BulkValueSection";
import { Undo2, Redo2 } from "lucide-react";

interface CellData {
  address: string;
  value: string;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: string;
}

interface MergedCell {
  startAddress: string;
  endAddress: string;
  colspan: number;
  rowspan: number;
  originalCells?: Map<string, CellData>;
}

interface ControlPanelProps {
  selectedCells: string[];
  onColorApply: (color: string) => void;
  onFormulaApply: (formula: string) => void;
  customFormulas?: Array<{ name: string; logic: string }>;
  onAddCustomFormula?: (name: string, logic: string) => void;
  onBulkAdd: (values: string[], separator: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  inputValue: string;
  outputValue: string;
  onInputChange: (value: string) => void;
  onOutputChange: (value: string) => void;
  onShowInput: () => void;
  onShowOutput: () => void;
}

export default function ControlPanel({
  selectedCells,
  onColorApply,
  onFormulaApply,
  customFormulas,
  onAddCustomFormula,
  onBulkAdd,
  onUndo,
  onRedo,
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

          <Separator />

          <ColorPicker onColorApply={onColorApply} />

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
