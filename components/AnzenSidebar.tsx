"use client";

import { useState } from "react";
import {
  Activity,
  ChevronRight,
  Link2,
  LogOut,
  MessageSquare,
  Moon,
  Plus,
  ShieldCheck,
  Sun,
  Trash2,
  Search,
  SquarePen,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import { AnzenLogo } from "@/components/AnzenLogo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import type { StoredChat } from "@/lib/chat-history";
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
  connectedCount,
  statusLoading,
  isDark,
  onToggleDarkMode,
  signOutHref,
  userName = "User",
  userEmail,
  chats = [],
  activeChatId = null,
  onSelectChat,
  onDeleteChat,
}: {
  activePage: DashboardPage;
  onNavigate: (page: DashboardPage) => void;
  onNewChat: () => void;
  connectedCount: number;
  statusLoading: boolean;
  isDark: boolean;
  onToggleDarkMode: () => void;
  signOutHref: string;
  userName?: string;
  userEmail?: string;
  chats?: StoredChat[];
  activeChatId?: string | null;
  onSelectChat?: (id: string) => void;
  onDeleteChat?: (id: string) => void;
}) {
  const identity = resolveDisplayName(userName, userEmail);
  const { isMobile, setOpenMobile } = useSidebar();

  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="none" className="w-[60px] border-none bg-background">
      <SidebarHeader className="flex items-center py-4">
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onNewChat}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <SquarePen className="h-5 w-5" />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col items-center py-4">
        <div className="flex flex-col items-center gap-4">
          {NAV_ITEMS.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
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
        </div>
      </SidebarContent>

      <SidebarFooter className="flex flex-col items-center py-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative mb-2">
            <div className="flex items-center gap-1.5 rounded-full bg-[#E54D2E] px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
              <span className="size-1.5 rounded-full bg-white animate-pulse" />
              1 Issue
              <span className="ml-1 opacity-60">×</span>
            </div>
          </div>

          <button
            onClick={onToggleDarkMode}
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
