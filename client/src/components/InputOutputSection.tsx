import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface InputOutputSectionProps {
  inputValue: string;
  outputValue: string;
  onInputChange: (value: string) => void;
  onOutputChange: (value: string) => void;
  onShowInput: () => void;
  onShowOutput: () => void;
}

export default function InputOutputSection({
  inputValue,
  outputValue,
  onInputChange,
  onOutputChange,
  onShowInput,
  onShowOutput,
}: InputOutputSectionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Input</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={onShowInput}
            data-testid="button-show-input"
          >
            Show Selected
          </Button>
        </div>
        <Textarea
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Selected cell list will appear here..."
          className="font-mono text-sm resize-none h-20"
          data-testid="textarea-input"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Output</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={onShowOutput}
            data-testid="button-show-output"
          >
            Show Addresses
          </Button>
        </div>
        <Textarea
          value={outputValue}
          onChange={(e) => onOutputChange(e.target.value)}
          placeholder="Cell addresses will appear here..."
          className="font-mono text-sm resize-none h-20"
          data-testid="textarea-output"
        />
      </div>
    </div>
  );
}
