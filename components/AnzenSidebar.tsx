"use client";

import {
  Activity,
  Link2,
  MessageSquare,
  Moon,
  ShieldCheck,
  Sun,
  SquarePen,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { resolveDisplayName } from "@/lib/display-name";
import { cn } from "@/lib/utils";

export type DashboardPage = "chat" | "connections" | "activity" | "privacy";

const NAV_ITEMS: { id: DashboardPage; label: string; icon: LucideIcon }[] = [
  { id: "chat", label: "Chats", icon: MessageSquare },
  { id: "connections", label: "Connections", icon: Link2 },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "privacy", label: "Privacy", icon: ShieldCheck },
];

export function AnzenSidebar({
  activePage,
  onNavigate,
  onNewChat,
  isDark,
  onToggleDarkMode,
  userName = "User",
  userEmail,
}: {
  activePage: DashboardPage;
  onNavigate: (page: DashboardPage) => void;
  onNewChat: () => void;
  isDark: boolean;
  onToggleDarkMode: () => void;
  userName?: string;
  userEmail?: string;
}) {
  const identity = resolveDisplayName(userName, userEmail);

  return (
    <Sidebar collapsible="none" className="w-[60px] border-none bg-background">
      <SidebarHeader className="flex items-center py-4">
        <button
          type="button"
          onClick={onNewChat}
          aria-label="New chat"
          title="New chat"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        >
          <SquarePen className="h-5 w-5" />
        </button>
      </SidebarHeader>

      <SidebarContent className="flex flex-col items-center py-4">
        <nav aria-label="Dashboard" className="flex flex-col items-center gap-4">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              aria-label={label}
              title={label}
              aria-current={activePage === id ? "page" : undefined}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                activePage === id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
            </button>
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter className="flex flex-col items-center py-6">
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <Avatar className="size-8">
            <AvatarFallback className="text-[10px] font-medium bg-muted">
              {identity.initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
