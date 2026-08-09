"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (models.length === 0) return null;

  const active = models.find((model) => model.id === value) ?? models[0];
  const single = models.length === 1;

  if (single) {
    return (
      <span className="anzen-model-chip anzen-model-chip-static">
        <Cpu size={14} />
        <span className="anzen-model-chip-label">
          {active.providerLabel} · {active.label}
        </span>
      </span>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="anzen-model-chip"
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Change model"
      >
        <Cpu size={14} />
        <span className="anzen-model-chip-label">
          {active.providerLabel} · {active.label}
        </span>
        <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="anzen-model-menu" role="listbox" aria-label="Select model">
          {models.map((model) => {
            const selected = model.id === active.id;
            return (
              <button
                key={model.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(model.id);
                  setOpen(false);
                }}
                className="anzen-model-menu-item"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-foreground">
                    {model.label}
                  </span>
                  <span className="block truncate text-[12.5px] text-muted-foreground">
                    {model.providerLabel} · {model.modelId}
                  </span>
                </span>
                {selected && <Check size={16} className="shrink-0 text-accent-foreground" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
