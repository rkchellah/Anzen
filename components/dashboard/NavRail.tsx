"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Plug, List, Shield, Settings as SettingsIcon, LucideIcon } from "lucide-react";
import { AnzenLogo } from "@/components/AnzenLogo";

export type NavView = "chat" | "connections" | "activity" | "privacy" | "settings";

interface NavRailProps {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
}

interface NavItem {
  id: NavView;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { id: "connections", label: "Connections", icon: Plug },
  { id: "activity", label: "Activity", icon: List },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export function NavRail({ activeView, onNavigate }: NavRailProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-[width] duration-200 ease-in-out",
        isExpanded ? "w-60" : "w-16"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Brand / Logo */}
      <div className="flex h-16 items-center px-4 overflow-hidden shrink-0">
        <button
          onClick={() => onNavigate("chat")}
          className="flex items-center gap-4 hover:opacity-80 transition-opacity"
        >
          <div className="flex-shrink-0 w-8 flex justify-center">
            <AnzenLogo size={28} />
          </div>
          <span
            className={cn(
              "font-bold text-lg text-sidebar-foreground transition-opacity duration-200 ease-in-out whitespace-nowrap",
              isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            Anzen
          </span>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center h-10 rounded-lg transition-colors group relative",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
              title={!isExpanded ? item.label : undefined}
            >
              <div className="flex-shrink-0 w-12 flex justify-center">
                <Icon size={20} />
              </div>
              <span
                className={cn(
                  "font-medium text-sm transition-opacity duration-200 ease-in-out whitespace-nowrap",
                  isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
              >
                {item.label}
              </span>

              {/* Active Indicator (optional, Claude-style uses subtle background usually) */}
              {isActive && !isExpanded && (
                <div className="absolute left-0 w-1 h-5 bg-sidebar-primary rounded-r-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Optional: Footer can be added here if needed later */}
    </aside>
  );
}
