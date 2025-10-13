import { useState, memo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SpreadsheetCellProps {
  address: string;
  value: string;
  isSelected: boolean;
  isTemporary?: boolean;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  fontStyle?: string;
  textDecoration?: string;
  onClick: () => void;
  onDoubleClick: () => void;
  onChange: (value: string) => void;
  onAddressChange?: (address: string) => void;
}

const SpreadsheetCell = memo(function SpreadsheetCell({
  address,
  value,
  isSelected,
  isTemporary = false,
  backgroundColor = "transparent",
  fontSize = 10,
  fontWeight = "normal",
  fontFamily = "Arial",
  fontStyle = "normal",
  textDecoration = "none",
  onClick,
  onDoubleClick,
  onChange,
  onAddressChange,
}: SpreadsheetCellProps) {
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState(address);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when cell is selected
  useEffect(() => {
    if (isSelected && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
    }
  }, [isSelected]);

  const handleAddressDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingAddress(true);
    setTempAddress(address);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempAddress(e.target.value);
  };

  const handleAddressBlur = () => {
    if (onAddressChange && tempAddress !== address) {
      onAddressChange(tempAddress);
    }
    setIsEditingAddress(false);
  };

  const handleAddressKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddressBlur();
    } else if (e.key === "Escape") {
      setTempAddress(address);
      setIsEditingAddress(false);
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent) => {
    // For arrow keys, blur the textarea so document handler can work
    if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      if (textareaRef.current) {
        textareaRef.current.blur();
      }
      // Event will bubble to document handler for navigation
    }
  };

  // Show address only when cell is empty
  const showAddress = value === "";

  return (
    <div
      data-testid={`cell-${address}`}
      className={cn(
        "relative w-full h-full hover-elevate cursor-pointer transition-all duration-75 outline-none focus:outline-none",
        isSelected && "ring-2 ring-primary",
        isTemporary && !isSelected && "ring-2 ring-blue-500"
      )}
      style={{
        backgroundColor: backgroundColor,
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      tabIndex={isSelected ? 0 : -1}
    >
      {showAddress && (
        <div
          className="absolute top-0.5 left-1 text-[10px] font-mono text-muted-foreground pointer-events-auto select-none z-10"
          style={{ fontSize: "10px", opacity: isEditingAddress ? 1 : 0.4 }}
          onDoubleClick={handleAddressDoubleClick}
        >
          {isEditingAddress ? (
            <input
              type="text"
              value={tempAddress}
              onChange={handleAddressChange}
              onBlur={handleAddressBlur}
              onKeyDown={handleAddressKeyDown}
              className="w-12 bg-background border border-border px-1 rounded text-foreground"
              autoFocus
              data-testid={`input-address-${address}`}
            />
          ) : (
            address.length > 15 ? address.substring(0, 12) + "..." : address
          )}
        </div>
      )}
      <div className="w-full h-full flex items-center overflow-hidden">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleTextareaKeyDown}
          className="w-full bg-transparent border-none outline-none px-1 text-foreground resize-none hide-scrollbar"
          style={{ 
            fontSize: `${fontSize}px`,
            lineHeight: `${fontSize}px`,
            fontWeight,
            fontFamily,
            fontStyle,
            textDecoration,
            overflow: 'hidden',
            height: `${fontSize}px`
          }}
          data-testid={`input-${address}`}
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.address === nextProps.address &&
    prevProps.value === nextProps.value &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isTemporary === nextProps.isTemporary &&
    prevProps.backgroundColor === nextProps.backgroundColor &&
    prevProps.fontSize === nextProps.fontSize &&
    prevProps.fontWeight === nextProps.fontWeight &&
    prevProps.fontFamily === nextProps.fontFamily &&
    prevProps.fontStyle === nextProps.fontStyle &&
    prevProps.textDecoration === nextProps.textDecoration
  );
});

export default SpreadsheetCell;
