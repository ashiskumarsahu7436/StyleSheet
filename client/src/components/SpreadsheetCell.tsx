import { useState, memo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SpreadsheetCellProps {
  address: string;
  value: string;
  isSelected: boolean;
  isTemporary?: boolean;
  isFirstSelected?: boolean;
  isInSelectionBoundary?: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
  isDragging?: boolean;
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
  isFirstSelected = false,
  isInSelectionBoundary = { top: false, right: false, bottom: false, left: false },
  isDragging = false,
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

  // Auto-focus textarea when cell is selected OR temporary selected (arrow keys)
  useEffect(() => {
    const shouldFocus = isSelected || isTemporary;
    
    if (shouldFocus && textareaRef.current) {
      // Use requestAnimationFrame for more reliable focus timing
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (textareaRef.current && (isSelected || isTemporary)) {
            textareaRef.current.focus();
            // Move cursor to end
            const len = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(len, len);
          }
        });
      });
    } else if (!shouldFocus && textareaRef.current) {
      // Blur when cell is deselected
      textareaRef.current.blur();
    }
  }, [isSelected, isTemporary]);

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
    // For arrow keys, prevent default and let document handler work
    // Don't blur - let the new cell's focus override this one
    if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      // Event will bubble to document handler for navigation
      // The new cell will auto-focus via useEffect when isSelected changes
    }
  };

  // Show address only when cell is empty
  const showAddress = value === "";

  // Google Sheets style selection
  const isAnySelected = isSelected || isTemporary;
  
  // Build box-shadow for continuous boundary (appears all at once)
  const buildBoundaryShadow = () => {
    // Debug any boundary
    const hasAnyBoundary = isInSelectionBoundary.top || isInSelectionBoundary.right || 
                           isInSelectionBoundary.bottom || isInSelectionBoundary.left;
    
    if (hasAnyBoundary && (isSelected || isTemporary)) {
      console.log(`Cell ${address} - isDragging:${isDragging}, isFirstSelected:${isFirstSelected}, boundaries:`, isInSelectionBoundary);
    }
    
    if (isDragging || isFirstSelected) return undefined;
    
    const shadows: string[] = [];
    // Use actual Google Blue color directly (CSS variables don't work well in inline box-shadow)
    const color = 'rgb(66, 133, 244)';
    
    if (isInSelectionBoundary.top) {
      shadows.push(`inset 0 2px 0 0 ${color}`);
    }
    if (isInSelectionBoundary.right) {
      shadows.push(`inset -2px 0 0 0 ${color}`);
    }
    if (isInSelectionBoundary.bottom) {
      shadows.push(`inset 0 -2px 0 0 ${color}`);
    }
    if (isInSelectionBoundary.left) {
      shadows.push(`inset 2px 0 0 0 ${color}`);
    }
    
    return shadows.length > 0 ? shadows.join(', ') : undefined;
  };
  
  // Cell styling with Google Sheets-style selection
  const cellStyle: React.CSSProperties = {
    backgroundColor: isAnySelected ? 'var(--sheets-selection-bg)' : backgroundColor,
    // First selected cell always has border (even during drag)
    ...(isFirstSelected && {
      border: '2px solid rgb(66, 133, 244)',
    }),
    // Selection boundary using box-shadow (appears instantly and continuously)
    boxShadow: buildBoundaryShadow(),
  };

  return (
    <div
      data-testid={`cell-${address}`}
      className="relative w-full h-full hover-elevate cursor-pointer outline-none focus:outline-none"
      style={cellStyle}
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
    prevProps.isFirstSelected === nextProps.isFirstSelected &&
    prevProps.isInSelectionBoundary?.top === nextProps.isInSelectionBoundary?.top &&
    prevProps.isInSelectionBoundary?.right === nextProps.isInSelectionBoundary?.right &&
    prevProps.isInSelectionBoundary?.bottom === nextProps.isInSelectionBoundary?.bottom &&
    prevProps.isInSelectionBoundary?.left === nextProps.isInSelectionBoundary?.left &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.backgroundColor === nextProps.backgroundColor &&
    prevProps.fontSize === nextProps.fontSize &&
    prevProps.fontWeight === nextProps.fontWeight &&
    prevProps.fontFamily === nextProps.fontFamily &&
    prevProps.fontStyle === nextProps.fontStyle &&
    prevProps.textDecoration === nextProps.textDecoration
  );
});

export default SpreadsheetCell;
