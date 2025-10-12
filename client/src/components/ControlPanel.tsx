import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import InputOutputSection from "./InputOutputSection";
import FormulaSection from "./FormulaSection";
import BulkValueSection from "./BulkValueSection";

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
  temporarySelectedCells?: string[];
  onColorApply: (color: string) => void;
  onFormulaApply: (formula: string) => void;
  customFormulas?: Array<{ name: string; logic: string }>;
  onAddCustomFormula?: (name: string, logic: string) => void;
  onBulkAdd: (values: string[], separator: string) => void;
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
  onColorApply,
  onFormulaApply,
  customFormulas,
  onAddCustomFormula,
  onBulkAdd,
  inputValue,
  outputValue,
  onInputChange,
  onOutputChange,
  onShowInput,
  onShowOutput,
}: ControlPanelProps) {
  const totalSelected = selectedCells.length + temporarySelectedCells.length;
  return (
    <div className="w-full h-full border-l border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border select-none">
        <h2 className="font-semibold text-lg">Controls</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {totalSelected} cell{totalSelected !== 1 ? "s" : ""} selected
        </p>
        {temporarySelectedCells.length > 0 && (
          <p className="text-xs text-chart-2 mt-0.5">
            ({temporarySelectedCells.length} temporary - 5s)
          </p>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6 select-none">
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
