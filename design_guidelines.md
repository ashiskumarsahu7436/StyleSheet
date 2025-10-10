# Design Guidelines for StyleSheet

## Design Approach

**Selected Approach:** Design System + Reference Hybrid
- **Primary Reference:** Google Sheets (spreadsheet patterns), Notion (clean interface)
- **Design System Foundation:** Material Design principles for data-rich applications
- **Justification:** Utility-focused productivity tool requiring information clarity, efficient data visualization, and stable user experience

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Primary: 220 75% 50% (Professional blue for actions and headers)
- Background: 0 0% 100% (Pure white for main area)
- Surface: 220 20% 97% (Light gray for panels and secondary surfaces)
- Border: 220 15% 88% (Subtle borders for grid and sections)
- Text Primary: 220 20% 15% (Near black for main content)
- Text Secondary: 220 15% 45% (Gray for cell addresses, labels)
- Success: 145 65% 45% (Green for formula success states)
- Accent: 270 60% 55% (Purple for selected cells)

**Dark Mode:**
- Primary: 220 75% 60% (Lighter blue for visibility)
- Background: 220 20% 10% (Dark charcoal)
- Surface: 220 18% 15% (Slightly lighter surface)
- Border: 220 15% 25% (Visible borders in dark)
- Text Primary: 220 15% 95% (Near white)
- Text Secondary: 220 10% 65% (Light gray for addresses)
- Success: 145 60% 50%
- Accent: 270 65% 65%

### B. Typography

**Font Families:**
- Primary: 'Inter' (UI elements, buttons, labels) - Google Fonts
- Monospace: 'JetBrains Mono' (cell addresses, formulas) - Google Fonts

**Hierarchy:**
- Section Headers: 16px, semibold (600)
- Button Labels: 14px, medium (500)
- Cell Content: 14px, normal (400)
- Cell Addresses: 11px, normal (400), monospace
- Formula Text: 13px, medium (500), monospace

### C. Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 8, 12, 16
- Micro spacing (cell padding): p-2
- Component spacing: p-4, gap-4
- Section spacing: p-8, gap-8
- Panel padding: p-6

**Grid Structure:**
- Main Container: Two-column layout (65-35 split on desktop)
- Left Panel: Spreadsheet grid (fixed aspect, scrollable)
- Right Panel: Sidebar controls (scrollable, sticky header)
- Responsive: Stack vertically on tablet/mobile

### D. Component Library

**Spreadsheet Grid:**
- Cell Size: 80px width × 32px height
- Cell Borders: 1px solid border color
- Cell Address Overlay: Absolute positioned, top-left, opacity-40
- Selected Cell: Accent color border (2px), background with 10% opacity
- Hover State: Border color darkened, subtle background tint

**Right Sidebar Sections:**
1. **Cell Customization Panel:**
   - Scrollable container with max-h-screen
   - Section groups with border-b dividers
   - Compact button grid (grid-cols-2, gap-2)

2. **Input/Output Controls:**
   - Textarea: border, rounded-md, min-h-24, monospace font
   - Action Buttons: Full width, gap-2 between
   - Label: Text-sm, font-medium, mb-2

3. **Formula Section:**
   - Formula buttons in grid (grid-cols-3, gap-1)
   - Small, compact buttons with function names
   - Active formula highlighted with primary color

4. **Bulk Value Addition:**
   - Large textarea: min-h-32, border-2 when focused
   - Separator input: Small, inline, w-16
   - Preview area showing value distribution

**Button Styles:**
- Primary: Solid background with primary color, white text
- Secondary: Border with primary color, primary text
- Formula: Small, rounded-sm, compact padding (px-2 py-1)
- Icon Buttons: Square, rounded, hover:bg-surface

**Form Controls:**
- Input Fields: border, rounded-md, px-3 py-2, focus:ring-2
- Textareas: Same as inputs, resize-none or resize-vertical
- Select Dropdowns: Chevron icon, consistent styling

### E. Interactions & States

**Cell Selection:**
- Single click: Select cell, show accent border
- Drag select: Multi-cell selection with accent overlay
- Shift+Click: Range selection
- Visual feedback: Smooth transition (150ms)

**Sidebar Scrolling:**
- Smooth scroll behavior
- Sticky section headers when scrolling
- Scrollbar styling: Thin, auto-hide on desktop

**Button Interactions:**
- Hover: Slight background darken, transform scale-105 (optional, subtle)
- Active: Background pressed state
- Disabled: Opacity-50, cursor-not-allowed

**Formula Application:**
- Click formula → select cells → apply
- Visual indicator showing selected range
- Result preview before confirmation

## Special Considerations

**Spreadsheet-Specific:**
- Column headers (A, B, C...): Sticky top, bg-surface, font-semibold
- Row numbers (1, 2, 3...): Sticky left, bg-surface, text-sm
- Grid lines: Consistent 1px throughout
- Cell focus indicator: Double border or shadow

**Responsive Behavior:**
- Desktop (lg+): Full two-column layout
- Tablet (md): Narrower grid, full-width sidebar below
- Mobile: Single column, spreadsheet scrollable horizontally

**Accessibility:**
- Keyboard navigation: Arrow keys for cell movement, Tab for controls
- Focus indicators: Clear 2px ring on all interactive elements
- Color contrast: WCAG AA compliant in both modes
- Screen reader: Proper labels for all controls and cell addresses

**Performance:**
- Virtual scrolling for large datasets (if needed)
- Lazy render cells outside viewport
- Debounced input for bulk value addition

## Visual Hierarchy

1. **Primary Focus:** Spreadsheet grid (largest visual weight)
2. **Secondary:** Right sidebar controls (organized, scannable)
3. **Tertiary:** Cell addresses, formula previews (supporting info)

**Separation:**
- Clear vertical divider between grid and sidebar (1px border)
- Section dividers in sidebar (border-b)
- Grouped functionality with whitespace separation (gap-6)