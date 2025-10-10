import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FormulaSectionProps {
  onFormulaApply: (formula: string) => void;
  customFormulas?: Array<{ name: string; logic: string }>;
  onAddCustomFormula?: (name: string, logic: string) => void;
}

const DEFAULT_FORMULAS = [
  { name: "SUM", icon: Calculator },
  { name: "AVERAGE", icon: Calculator },
  { name: "COUNT", icon: Calculator },
  { name: "MIN", icon: Calculator },
  { name: "MAX", icon: Calculator },
  { name: "MULTIPLY", icon: Calculator },
];

export default function FormulaSection({
  onFormulaApply,
  customFormulas = [],
  onAddCustomFormula,
}: FormulaSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formulaName, setFormulaName] = useState("");
  const [formulaLogic, setFormulaLogic] = useState("");

  const handleAddFormula = () => {
    if (formulaName && formulaLogic && onAddCustomFormula) {
      onAddCustomFormula(formulaName, formulaLogic);
      setFormulaName("");
      setFormulaLogic("");
      setIsDialogOpen(false);
    }
  };

  const allFormulas = [...DEFAULT_FORMULAS, ...customFormulas.map(f => ({ name: f.name, icon: Calculator }))];

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Formulas</Label>
      <div className="grid grid-cols-3 gap-2">
        {allFormulas.map((formula) => (
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="secondary"
            size="sm"
            className="w-full gap-2"
            data-testid="button-add-formula"
          >
            <Plus className="w-4 h-4" />
            Add Custom Formula
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Formula</DialogTitle>
            <DialogDescription>
              Create a new formula with a name and logic. Use standard JavaScript operations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="formula-name">Formula Name</Label>
              <Input
                id="formula-name"
                placeholder="e.g., AVERAGE_SQUARED"
                value={formulaName}
                onChange={(e) => setFormulaName(e.target.value.toUpperCase())}
                data-testid="input-formula-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="formula-logic">Formula Logic (JavaScript)</Label>
              <Input
                id="formula-logic"
                placeholder="e.g., values.reduce((a,b)=>a+b,0)/values.length"
                value={formulaLogic}
                onChange={(e) => setFormulaLogic(e.target.value)}
                data-testid="input-formula-logic"
              />
              <p className="text-xs text-muted-foreground">
                Use values array in your formula. Example: values.reduce((a,b){'=>'}a+b,0)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              data-testid="button-cancel-formula"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddFormula}
              disabled={!formulaName || !formulaLogic}
              data-testid="button-save-formula"
            >
              Add Formula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
