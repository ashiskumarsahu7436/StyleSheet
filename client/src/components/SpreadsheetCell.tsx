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
  isEditing?: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onChange: (value: string) => void;
  onAddressChange?: (address: string) => void;
  onEnterEditMode?: () => void;
  onExitEditMode?: () => void;
}

const SpreadsheetCell = memo(function SpreadsheetCell({
  address,
  value,
  isSelected,
  isTemporary = false,
  backgroundColor = "transparent",
  fontSize = 13, // Better matches default cell height
  fontWeight = "normal",
  fontFamily = "Arial", // Google Sheets default
  fontStyle = "normal",
  textDecoration = "none",
  isEditing = false,
  onClick,
  onDoubleClick,
  onChange,
  onAddressChange,
  onEnterEditMode,
  onExitEditMode,
}: SpreadsheetCellProps) {
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState(address);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus/blur textarea based on edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
    } else if (!isEditing && textareaRef.current) {
      textareaRef.current.blur();
    }
  }, [isEditing]);

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

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    // Enter edit mode when Enter is pressed (if not already editing)
    if (e.key === "Enter" && !isEditing && isSelected) {
      e.preventDefault();
      onEnterEditMode?.();
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent) => {
    // Exit edit mode on Enter, Escape, or Tab
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onExitEditMode?.();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onExitEditMode?.();
    } else if (e.key === "Tab") {
      e.preventDefault();
      onExitEditMode?.();
    }
  };

  return (
    <div
      data-testid={`cell-${address}`}
      className={cn(
        "relative w-full h-full hover-elevate cursor-pointer transition-all duration-75",
        isSelected && "ring-2 ring-primary",
        isTemporary && !isSelected && "ring-2 ring-blue-500"
      )}
      style={{
        backgroundColor: backgroundColor,
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onKeyDown={handleCellKeyDown}
      tabIndex={isSelected ? 0 : -1}
    >
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
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleTextareaKeyDown}
        onFocus={() => onEnterEditMode?.()}
        className="w-full h-full bg-transparent border-none outline-none px-1 pt-0.5 text-foreground resize-none align-top overflow-hidden"
        style={{ 
          fontSize: `${fontSize}px`,
          lineHeight: `${fontSize * 1.4}px`,
          fontWeight,
          fontFamily,
          fontStyle,
          textDecoration,
          verticalAlign: 'top',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          pointerEvents: isEditing ? 'auto' : 'none'
        }}
        data-testid={`input-${address}`}
      />
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
    prevProps.textDecoration === nextProps.textDecoration &&
    prevProps.isEditing === nextProps.isEditing
  );
});

export default SpreadsheetCell;
