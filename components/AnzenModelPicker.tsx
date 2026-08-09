"use client";

import { Check, ChevronDown, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type AnzenModelOption = {
  id: string;
  label: string;
  providerLabel: string;
  modelId: string;
};

/**
 * Shows which model answers the current chat, and lets the user switch when the
 * server exposes more than one. With a single model it degrades to a label.
 */
export function AnzenModelPicker({
  models,
  value,
  onChange,
  disabled = false,
}: {
  models: AnzenModelOption[];
  value: string | null;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  if (models.length === 0) return null;

  const active = models.find((model) => model.id === value) ?? models[0];

  if (models.length === 1) {
    return (
      <Badge variant="outline" className="text-muted-foreground gap-1.5 font-normal">
        <Cpu className="size-3.5" />
        Model - {active.label}
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              className="h-7 gap-1.5 rounded-full bg-transparent px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground data-[popup-open]:text-foreground"
            />
          }
        >
          <span className="truncate">{active.label}</span>
          <ChevronDown className="size-3 opacity-60" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" side="top" className="min-w-64">
          <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Select Model
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {models.map((model) => {
            const selected = model.id === active.id;
            return (
              <DropdownMenuItem
                key={model.id}
                onClick={() => onChange(model.id)}
                className="gap-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{model.label}</span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {model.providerLabel} · {model.modelId}
                  </span>
                </span>
                {selected && <Check className="text-primary size-4 shrink-0" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
