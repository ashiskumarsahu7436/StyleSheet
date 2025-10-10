import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BulkValueSectionProps {
  onBulkAdd: (values: string[], separator: string) => void;
}

export default function BulkValueSection({ onBulkAdd }: BulkValueSectionProps) {
  const [bulkText, setBulkText] = useState("");
  const [separator, setSeparator] = useState(",");

  const handleBulkAdd = () => {
    const values = bulkText.split(separator).map((v) => v.trim()).filter((v) => v);
    onBulkAdd(values, separator);
    console.log("Bulk add with separator:", separator, "Values:", values);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Bulk Value Addition</Label>
      <Textarea
        value={bulkText}
        onChange={(e) => setBulkText(e.target.value)}
        placeholder="Enter values separated by comma, space, or custom character..."
        className="font-mono text-sm resize-none h-24"
        data-testid="textarea-bulk-values"
      />
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-2">
          <Label className="text-xs text-muted-foreground">Separator</Label>
          <Input
            value={separator}
            onChange={(e) => setSeparator(e.target.value)}
            placeholder=","
            className="w-full font-mono"
            maxLength={3}
            data-testid="input-separator"
          />
        </div>
        <Button
          onClick={handleBulkAdd}
          size="sm"
          className="flex-1"
          data-testid="button-write-cells"
        >
          Write in Cells
        </Button>
      </div>
    </div>
  );
}
