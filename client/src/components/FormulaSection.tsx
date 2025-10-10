import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calculator, Plus } from "lucide-react";

interface FormulaSectionProps {
  onFormulaApply: (formula: string) => void;
}

const FORMULAS = [
  { name: "SUM", icon: Calculator },
  { name: "AVERAGE", icon: Calculator },
  { name: "COUNT", icon: Calculator },
  { name: "MIN", icon: Calculator },
  { name: "MAX", icon: Calculator },
  { name: "MULTIPLY", icon: Calculator },
];

export default function FormulaSection({ onFormulaApply }: FormulaSectionProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Formulas</Label>
      <div className="grid grid-cols-3 gap-2">
        {FORMULAS.map((formula) => (
          <Button
            key={formula.name}
            variant="outline"
            size="sm"
            className="text-xs font-mono"
            onClick={() => onFormulaApply(formula.name)}
            data-testid={`button-formula-${formula.name.toLowerCase()}`}
          >
            {formula.name}
          </Button>
        ))}
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="w-full gap-2"
        onClick={() => console.log("Add custom formula")}
        data-testid="button-add-formula"
      >
        <Plus className="w-4 h-4" />
        Add Custom Formula
      </Button>
    </div>
  );
}
