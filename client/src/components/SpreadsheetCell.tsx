import { cn } from "@/lib/utils";

interface SpreadsheetCellProps {
  address: string;
  value: string;
  isSelected: boolean;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: string;
  onClick: () => void;
  onDoubleClick: () => void;
  onChange: (value: string) => void;
}

export default function SpreadsheetCell({
  address,
  value,
  isSelected,
  backgroundColor = "transparent",
  fontSize = 14,
  fontWeight = "normal",
  onClick,
  onDoubleClick,
  onChange,
}: SpreadsheetCellProps) {
  return (
    <div
      data-testid={`cell-${address}`}
      className={cn(
        "relative border border-border w-20 h-8 hover-elevate cursor-pointer",
        isSelected && "ring-2 ring-primary bg-primary/10"
      )}
      style={{
        backgroundColor: isSelected ? undefined : backgroundColor,
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div
        className="absolute top-0.5 left-1 text-[10px] font-mono text-muted-foreground opacity-40 pointer-events-none select-none"
        style={{ fontSize: "10px" }}
      >
        {address}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-full bg-transparent border-none outline-none px-2 pt-3 text-foreground"
        style={{ fontSize: `${fontSize}px`, fontWeight }}
        data-testid={`input-${address}`}
      />
    </div>
  );
}
