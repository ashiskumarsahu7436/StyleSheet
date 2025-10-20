import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import InputOutputSection from "./InputOutputSection";
import FormulaSection from "./FormulaSection";
import BulkValueSection from "./BulkValueSection";

interface CellData {
  address: string;
  value: string;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: string;
}

interface MergedCell {
  startAddress: string;
  endAddress: string;
  colspan: number;
  rowspan: number;
  originalCells?: Map<string, CellData>;
}

interface ControlPanelProps {
  selectedCells: string[];
  temporarySelectedCells?: string[];
  onColorApply: (color: string) => void;
  onFormulaApply: (formula: string) => void;
  customFormulas?: Array<{ name: string; logic: string }>;
  onAddCustomFormula?: (name: string, logic: string) => void;
  onBulkAdd: (values: string[], separator: string) => void;
  inputValue: string;
  outputValue: string;
  onInputChange: (value: string) => void;
  onOutputChange: (value: string) => void;
  onShowInput: () => void;
  onShowOutput: () => void;
}

export default function ControlPanel({
  selectedCells,
  temporarySelectedCells = [],
  onColorApply,
  onFormulaApply,
  customFormulas,
  onAddCustomFormula,
  onBulkAdd,
  inputValue,
  outputValue,
  onInputChange,
  onOutputChange,
  onShowInput,
  onShowOutput,
}: ControlPanelProps) {
  const totalSelected = selectedCells.length + temporarySelectedCells.length;
  const { user, isLoading, isAuthenticated } = useAuth();

  return (
    <div className="w-full h-full border-l border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border select-none">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 className="font-semibold text-lg">Controls</h2>
          {/* User Authentication UI - Google style profile picture */}
          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8" data-testid="avatar-user">
                {user.profileImageUrl && (
                  <AvatarImage 
                    src={user.profileImageUrl} 
                    alt={user.email || "User"} 
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  {user.firstName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => window.location.href = "/api/auth/logout"}
                title="Logout"
                data-testid="button-logout"
                className="h-8 w-8"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => window.location.href = "/api/auth/google"}
              data-testid="button-login"
              className="h-8"
            >
              <LogIn className="h-4 w-4 mr-1" />
              Sign in with Google
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {totalSelected} cell{totalSelected !== 1 ? "s" : ""} selected
        </p>
        {temporarySelectedCells.length > 0 && (
          <p className="text-xs text-chart-2 mt-0.5">
            ({temporarySelectedCells.length} temporary - 5s)
          </p>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6 select-none">
          <InputOutputSection
            inputValue={inputValue}
            outputValue={outputValue}
            onInputChange={onInputChange}
            onOutputChange={onOutputChange}
            onShowInput={onShowInput}
            onShowOutput={onShowOutput}
          />

          <Separator />

          <FormulaSection 
            onFormulaApply={onFormulaApply}
            customFormulas={customFormulas}
            onAddCustomFormula={onAddCustomFormula}
          />

          <Separator />

          <BulkValueSection onBulkAdd={onBulkAdd} />
        </div>
      </ScrollArea>
    </div>
  );
}
