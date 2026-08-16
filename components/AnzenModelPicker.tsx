"use client";

import { ChevronDown } from "lucide-react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from "@/components/ui/select";

export type AnzenModelOption = {
  id: string;
  label: string;
  providerLabel: string;
  modelId: string;
};

/**
 * Model picker for the app bar.
 *
 * The trigger renders its own content rather than `<SelectValue/>`: Base UI's
 * Value prints the raw `value` when given no children, so the bar was showing
 * the internal `deepseek:deepseek-v4` key, clipped mid-word by the trigger's
 * max-width. What belongs there is the model's name.
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

  // Nothing to choose between — state, not a control.
  if (models.length === 1) {
    return (
      <span className="hidden items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground sm:inline-flex">
        <span className="anzen-ordinal">{active.providerLabel}</span>
        <span className="font-medium text-foreground/85">{active.label}</span>
      </span>
    );
  }

  // Provider groups in first-seen order, so the list reads DeepSeek → Groq
  // rather than as one flat run of near-identical names.
  const groups = models.reduce<Array<{ provider: string; items: AnzenModelOption[] }>>(
    (acc, model) => {
      const group = acc.find((entry) => entry.provider === model.providerLabel);
      if (group) group.items.push(model);
      else acc.push({ provider: model.providerLabel, items: [model] });
      return acc;
    },
    []
  );

  return (
    <Select
      value={active.id}
      onValueChange={(next) => {
        if (typeof next === "string") onChange(next);
      }}
      disabled={disabled}
    >
      {/* Base UI's Trigger used directly: the shared SelectTrigger appends its
          own chevron and value-slot rules, which fight this layout. */}
      <SelectPrimitive.Trigger
        aria-label="Model"
        className="flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-xs whitespace-nowrap text-muted-foreground transition-colors outline-none select-none hover:border-primary/30 focus-visible:border-primary/40 disabled:opacity-50"
      >
        <span className="anzen-ordinal hidden shrink-0 md:inline">
          {active.providerLabel}
        </span>
        <span className="max-w-[10rem] truncate font-medium text-foreground/85">
          {active.label}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </SelectPrimitive.Trigger>

      <SelectContent
        align="end"
        alignItemWithTrigger={false}
        sideOffset={6}
        className="w-[15rem] rounded-xl border border-border bg-popover p-0 shadow-[var(--anzen-elev-3)] ring-0"
      >
        {groups.map((group) => (
          <SelectGroup key={group.provider} className="p-1.5">
            <SelectLabel className="anzen-tile-label mb-1 px-2 pt-1">
              {group.provider}
            </SelectLabel>
            {group.items.map((model) => (
              <SelectItem
                key={model.id}
                value={model.id}
                className="cursor-pointer items-start rounded-lg py-2 pr-9 pl-2.5"
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[13px] leading-tight font-medium text-foreground">
                    {model.label}
                  </span>
                  <span className="anzen-ordinal truncate">{model.modelId}</span>
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
