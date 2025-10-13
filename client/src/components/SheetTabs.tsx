import { Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Sheet {
  id: string;
  name: string;
}

interface SheetTabsProps {
  sheets: Sheet[];
  activeSheetId: string;
  onSheetChange: (sheetId: string) => void;
  onAddSheet: () => void;
  onRenameSheet: (sheetId: string, newName: string) => void;
  onDeleteSheet: (sheetId: string) => void;
}

export default function SheetTabs({
  sheets,
  activeSheetId,
  onSheetChange,
  onAddSheet,
  onRenameSheet,
  onDeleteSheet,
}: SheetTabsProps) {
  return (
    <div className="flex items-center gap-1 h-10 border-t border-border bg-background px-2">
      {/* Add Sheet Button */}
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7"
        onClick={onAddSheet}
        data-testid="button-add-sheet"
        title="Add sheet"
      >
        <Plus className="h-4 w-4" />
      </Button>

      {/* All Sheets Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            data-testid="button-all-sheets"
            title="All sheets"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {sheets.map((sheet) => (
            <DropdownMenuItem
              key={sheet.id}
              onClick={() => onSheetChange(sheet.id)}
              className={activeSheetId === sheet.id ? "bg-accent" : ""}
              data-testid={`menu-sheet-${sheet.id}`}
            >
              {sheet.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sheet Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto flex-1">
        {sheets.map((sheet) => (
          <div
            key={sheet.id}
            className={`
              px-3 py-1 text-sm cursor-pointer rounded-t-md select-none
              transition-colors whitespace-nowrap
              ${
                activeSheetId === sheet.id
                  ? "bg-background border-t border-l border-r border-border font-medium"
                  : "hover-elevate text-muted-foreground"
              }
            `}
            onClick={() => onSheetChange(sheet.id)}
            onDoubleClick={() => {
              const newName = prompt("Rename sheet:", sheet.name);
              if (newName && newName.trim()) {
                onRenameSheet(sheet.id, newName.trim());
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (sheets.length > 1) {
                if (confirm(`Delete "${sheet.name}"?`)) {
                  onDeleteSheet(sheet.id);
                }
              }
            }}
            data-testid={`tab-sheet-${sheet.id}`}
            title={`${sheet.name} (Double-click to rename, Right-click to delete)`}
          >
            {sheet.name}
          </div>
        ))}
      </div>
    </div>
  );
}
