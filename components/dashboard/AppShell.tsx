"use client";

import React, { ReactNode } from "react";
import { NavRail, NavView } from "./NavRail";

interface AppShellProps {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
  children: ReactNode;
}

export function AppShell({ activeView, onNavigate, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      {/* Navigation Rail */}
      <NavRail activeView={activeView} onNavigate={onNavigate} />
      
      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col min-w-0 pl-16 relative">
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
