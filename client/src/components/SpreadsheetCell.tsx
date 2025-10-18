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
  color?: string; // Text color
  fontSize?: number; // Font size in pt (points)
  fontWeight?: string;
  fontFamily?: string;
  fontStyle?: string;
  textDecoration?: string;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  cellHeight?: number; // Row height in pixels
  onClick: () => void;
  onDoubleClick: () => void;
  onChange: (value: string) => void;
  onAddressChange?: (address: string) => void;
  onPaste?: (startAddress: string, data: string[][], formatting?: Array<Array<{ 
    bold?: boolean; 
    italic?: boolean; 
    underline?: boolean;
    fontFamily?: string;
    fontSize?: number; // pt value
    color?: string;
    backgroundColor?: string;
  }>>) => void;
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
  color = "#000000",
  fontSize = 11, // Default 11pt (Google Sheets standard)
  fontWeight = "normal",
  fontFamily = "Arial",
  fontStyle = "normal",
  textDecoration = "none",
  borderTop,
  borderRight,
  borderBottom,
  borderLeft,
  cellHeight = 21, // Default row height in pixels
  onClick,
  onDoubleClick,
  onChange,
  onAddressChange,
  onPaste,
}: SpreadsheetCellProps) {
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState(address);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea ONLY when this is the first selected cell
  // This prevents focus from jumping to the drag end corner during selection
  useEffect(() => {
    const isAnySelected = isSelected || isTemporary;
    const shouldFocus = isAnySelected && isFirstSelected;
    
    if (shouldFocus && textareaRef.current) {
      // Use requestAnimationFrame for more reliable focus timing
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (textareaRef.current && isFirstSelected) {
            textareaRef.current.focus();
            // Move cursor to end
            const len = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(len, len);
          }
        });
      });
    } else if (!isAnySelected && textareaRef.current) {
      // Blur when cell is deselected
      textareaRef.current.blur();
    }
  }, [isSelected, isTemporary, isFirstSelected]);

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

  const handlePaste = (e: React.ClipboardEvent) => {
    if (!onPaste) return;
    
    // Try to get HTML data first (to preserve formatting)
    const htmlData = e.clipboardData.getData('text/html');
    const textData = e.clipboardData.getData('text/plain');
    
    // Debug all available clipboard types
    const types = e.clipboardData.types;
    console.log('📋 Available clipboard types:', types);
    console.log('📋 HTML length:', htmlData?.length || 0);
    console.log('📋 Text data:', textData.substring(0, 200));
    
    // Check if it contains tabs or newlines (table data)
    if (textData.includes('\t') || textData.includes('\n')) {
      e.preventDefault(); // Prevent default paste into single cell
      
      // Parse text data into 2D array
      const rows = textData.split('\n').map(row => row.split('\t'));
      
      // Remove last row if it's empty (happens when copying from Excel/Sheets)
      if (rows.length > 0 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
        rows.pop();
      }
      
      // Parse HTML for formatting if available
      let formattingData: Array<Array<{ 
        bold?: boolean; 
        italic?: boolean; 
        underline?: boolean;
        fontFamily?: string;
        fontSize?: number; // Changed to number (will store pt value)
        color?: string;
        backgroundColor?: string;
      }>> = [];
      
      if (htmlData) {
        console.log('📋 Full HTML:', htmlData.substring(0, 1000));
        
        // Create a temporary DOM element to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlData;
        // Append to body to get computed styles
        document.body.appendChild(tempDiv);
        tempDiv.style.visibility = 'hidden';
        tempDiv.style.position = 'absolute';
        
        try {
          // Try to find table structure in HTML
          const table = tempDiv.querySelector('table');
          console.log('📊 Table found:', !!table);
          
          if (table) {
            const tableRows = Array.from(table.querySelectorAll('tr'));
            formattingData = tableRows.map(tr => {
              const cells = Array.from(tr.querySelectorAll('td, th'));
              return cells.map(cell => {
                const formatting: { 
                  bold?: boolean; 
                  italic?: boolean; 
                  underline?: boolean;
                  fontFamily?: string;
                  fontSize?: number;
                  color?: string;
                  backgroundColor?: string;
                } = {};
                
                // RGB to Hex converter
                const rgbToHex = (rgb: string): string | null => {
                  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
                  if (!match) return null;
                  const r = parseInt(match[1]);
                  const g = parseInt(match[2]);
                  const b = parseInt(match[3]);
                  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
                };
                
                // Use getComputedStyle for accurate style extraction
                const computedStyle = window.getComputedStyle(cell);
                
                // Background color - extract even if white (we'll filter later)
                const bgColor = computedStyle.backgroundColor;
                if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                  const bgHex = rgbToHex(bgColor);
                  if (bgHex && bgHex !== '#FFFFFF') { // Ignore pure white
                    formatting.backgroundColor = bgHex;
                    console.log('✅ BG color extracted:', bgHex, 'from', bgColor);
                  }
                }
                
                // Text color - extract all colors
                const textColor = computedStyle.color;
                if (textColor) {
                  const colorHex = rgbToHex(textColor);
                  if (colorHex && colorHex !== '#000000') { // Don't store black as it's default
                    formatting.color = colorHex;
                    console.log('✅ Text color extracted:', colorHex, 'from', textColor);
                  }
                }
                
                // Font family
                const fontFamily = computedStyle.fontFamily;
                if (fontFamily && fontFamily !== 'Times New Roman') { // Ignore default
                  formatting.fontFamily = fontFamily.split(',')[0].trim().replace(/["']/g, '');
                  console.log('✅ Font family extracted:', formatting.fontFamily);
                }
                
                // Font size - convert px to pt (1px = 0.75pt, so px/1.333 = pt)
                const fontSizePx = parseFloat(computedStyle.fontSize);
                if (!isNaN(fontSizePx) && fontSizePx > 0) {
                  // Convert px to pt: pt = px / 1.333 (or px * 0.75)
                  const fontSizePt = Math.round(fontSizePx * 0.75);
                  if (fontSizePt !== 11) { // 11pt is default, don't store
                    formatting.fontSize = fontSizePt;
                    console.log('✅ Font size extracted:', fontSizePt + 'pt', 'from', fontSizePx + 'px');
                  }
                }
                
                // Font weight (bold)
                const fontWeight = computedStyle.fontWeight;
                if (fontWeight === 'bold' || parseInt(fontWeight) >= 600) {
                  formatting.bold = true;
                  console.log('✅ Bold detected');
                }
                
                // Font style (italic)
                if (computedStyle.fontStyle === 'italic') {
                  formatting.italic = true;
                  console.log('✅ Italic detected');
                }
                
                // Text decoration (underline)
                const textDeco = computedStyle.textDecoration || computedStyle.textDecorationLine;
                if (textDeco && textDeco.includes('underline')) {
                  formatting.underline = true;
                  console.log('✅ Underline detected');
                }
                
                console.log('📋 Final formatting for cell:', formatting);
                return formatting;
              });
            });
          }
        } finally {
          // Clean up
          document.body.removeChild(tempDiv);
        }
      }
      
      // Call the onPaste handler with parsed data and formatting
      onPaste(address, rows, formattingData);
    }
    // If no tabs/newlines, let default paste behavior work (single cell)
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
  
  // Cell styling - always show actual background color
  const cellStyle: React.CSSProperties = {
    backgroundColor: backgroundColor,
    // Custom borders from border formatting
    ...(borderTop && { borderTop }),
    ...(borderRight && { borderRight }),
    ...(borderBottom && { borderBottom }),
    ...(borderLeft && { borderLeft }),
  };

  // Selection overlay styling (appears above cell color but below text)
  const selectionOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'var(--sheets-selection-bg)',
    pointerEvents: 'none',
    // First selected cell border
    ...(isFirstSelected && {
      border: '2px solid rgb(66, 133, 244)',
    }),
    // Selection boundary using box-shadow
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
      {/* Selection overlay - appears below text but above cell background */}
      {isAnySelected && <div style={selectionOverlayStyle} />}
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
      <div className={cn(
        "w-full h-full flex overflow-hidden relative z-10",
        cellHeight <= 21 ? "items-center" : "items-start"
      )}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleTextareaKeyDown}
          onPaste={handlePaste}
          className="w-full bg-transparent border-none outline-none px-1 resize-none hide-scrollbar relative z-10"
          style={{ 
            fontSize: `${fontSize}pt`,
            lineHeight: `${fontSize * 1.2}pt`,
            fontWeight,
            fontFamily,
            fontStyle,
            textDecoration,
            color: color,
            overflow: 'hidden',
            height: cellHeight <= 21 ? `${fontSize}pt` : `${cellHeight - 2}px`,
            whiteSpace: cellHeight <= 21 ? 'nowrap' : 'pre-wrap'
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
    prevProps.color === nextProps.color &&
    prevProps.fontSize === nextProps.fontSize &&
    prevProps.fontWeight === nextProps.fontWeight &&
    prevProps.fontFamily === nextProps.fontFamily &&
    prevProps.fontStyle === nextProps.fontStyle &&
    prevProps.textDecoration === nextProps.textDecoration &&
    prevProps.cellHeight === nextProps.cellHeight
  );
});

export default SpreadsheetCell;
