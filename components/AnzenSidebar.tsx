"use client";

import { useState } from "react";
import {
  Activity,
  Blocks,
  ChevronRight,
  LogOut,
  MessageSquare,
  Moon,
  Pencil,
  ShieldCheck,
  SquarePen,
  Sun,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AnzenLogo } from "@/components/AnzenLogo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import type { StoredChat } from "@/lib/chat-history";
import { cn } from "@/lib/utils";

export type DashboardPage = "chat" | "connections" | "activity" | "privacy";

const NAV_ITEMS: { id: DashboardPage; label: string; icon: LucideIcon }[] = [
  // Label matches the header title for this page — this view is the chat, and
  // calling it "Home" while showing a speech-bubble icon told two stories.
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "connections", label: "Apps", icon: Blocks },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "privacy", label: "Privacy", icon: ShieldCheck },
];

export function AnzenSidebar({
  activePage,
  onNavigate,
  onNewChat,
  isDark,
  onToggleDarkMode,
  preferredName = "",
  fullName = "",
  onEditName,
  chats = [],
  activeChatId = null,
  onSelectChat,
  onDeleteChat,
}: {
  activePage: DashboardPage;
  onNavigate: (page: DashboardPage) => void;
  onNewChat: () => void;
  isDark: boolean;
  onToggleDarkMode: () => void;
  /** What the user asked to be called. Shown in place of their email. */
  preferredName?: string;
  fullName?: string;
  onEditName?: () => void;
  /** Newest-first; stored in the browser only. */
  chats?: StoredChat[];
  activeChatId?: string | null;
  onSelectChat?: (id: string) => void;
  onDeleteChat?: (id: string) => void;
}) {
  // Null means "not yet decided by the user", which then follows whether there
  // is history to show. `chats` arrives from localStorage after mount, so a
  // plain `useState(chats.length > 0)` would latch to false on first render and
  // leave the list collapsed forever.
  const [chatsOpenOverride, setChatsOpen] = useState<boolean | null>(null);
  const chatsOpen = chatsOpenOverride ?? chats.length > 0;

  // The email is deliberately not shown. It is not something the user needs
  // reminding of on every screen, and it is the least human way to name them.
  const displayName = preferredName || fullName || "You";
  const secondaryLine =
    fullName && fullName.toLowerCase() !== displayName.toLowerCase()
      ? fullName
      : null;
  const initials = displayName.charAt(0).toUpperCase() || "A";

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-2 py-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Anzen"
              // Collapsed, the rail is 3rem and the button 2rem; the shared
              // p-2! would squeeze the 24px mark into a 16px box and push it
              // off centre. Drop the padding and centre the mark instead.
              className="h-10 gap-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
              onClick={() => onNavigate("chat")}
            >
              {/* Override the sidebar's [&_svg]:size-4 so the mark stays crisp. */}
              <span className="flex size-6 shrink-0 items-center justify-center [&_svg]:size-6!">
                <AnzenLogo size={24} />
              </span>
              <span className="truncate font-semibold tracking-tight">
                Anzen
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="anzen-scroll px-2">
        {/* The px-1 indent is an expanded-only nicety: collapsed it would sit
            on top of SidebarContent's px-2 and leave the 2rem icons 4px left
            of centre in the 3rem rail. */}
        <SidebarGroup className="px-1 pt-3 pb-1 group-data-[collapsible=icon]:px-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="New chat"
                  onClick={onNewChat}
                  className="font-medium"
                >
                  <SquarePen />
                  <span>New chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
                // One active treatment, not three: a background tint and
                // full-strength text. No accent bar, no coloured icon.
                const navButton = (
                  <SidebarMenuButton
                    tooltip={label}
                    isActive={activePage === id}
                    onClick={() => {
                      onNavigate(id);
                      if (id === "chat") setChatsOpen(true);
                    }}
                    className="font-medium data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground"
                  >
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                );

                if (id !== "chat") {
                  return <SidebarMenuItem key={id}>{navButton}</SidebarMenuItem>;
                }

                // Past conversations live *under* Chat, since that is what they
                // are — not a second top-level section repeating the same idea.
                return (
                  <SidebarMenuItem key={id}>
                    {navButton}

                    <SidebarMenuAction
                      aria-label={chatsOpen ? "Hide chats" : "Show chats"}
                      aria-expanded={chatsOpen}
                      onClick={(event) => {
                        event.stopPropagation();
                        setChatsOpen(!chatsOpen);
                      }}
                      className="text-muted-foreground group-data-[collapsible=icon]:hidden"
                    >
                      <ChevronRight
                        className={cn(
                          "transition-transform duration-150",
                          chatsOpen && "rotate-90"
                        )}
                      />
                    </SidebarMenuAction>

                    {chatsOpen && (
                      <SidebarMenuSub>
                        {chats.length === 0 ? (
                          <li className="px-1 py-1 text-xs text-muted-foreground">
                            Past chats appear here.
                          </li>
                        ) : (
                          chats.map((chat) => (
                            <SidebarMenuSubItem key={chat.id}>
                              <SidebarMenuSubButton
                                render={<button type="button" />}
                                isActive={
                                  activePage === "chat" && chat.id === activeChatId
                                }
                                onClick={() => onSelectChat?.(chat.id)}
                                className="w-full cursor-pointer pr-7 text-[13px] text-muted-foreground"
                              >
                                <span className="truncate">{chat.title}</span>
                              </SidebarMenuSubButton>

                              {onDeleteChat && (
                                // Not SidebarMenuAction: its hover reveal keys
                                // off group/menu-item, which does not exist
                                // inside a sub-item.
                                <button
                                  type="button"
                                  aria-label={`Delete ${chat.title}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onDeleteChat(chat.id);
                                  }}
                                  className="absolute top-1/2 right-1 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors group-focus-within/menu-sub-item:opacity-100 group-hover/menu-sub-item:opacity-100 hover:bg-sidebar-accent hover:text-destructive focus-visible:opacity-100 md:opacity-0 [&_svg]:size-3.5"
                                >
                                  <Trash2 />
                                </button>
                              )}
                            </SidebarMenuSubItem>
                          ))
                        )}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      {/* px-3, not px-2: the nav above sits at SidebarContent's px-2 plus the
          group's px-1, so a px-2 footer put every row 4px to the left of the
          items it lines up under. */}
      <SidebarFooter className="gap-1 px-3 pb-3 group-data-[collapsible=icon]:px-2">
        <SidebarSeparator className="mx-0" />

        {/* Identity doubles as the way to change what Anzen calls you — the
            only thing there is to edit here, so it needs no separate control. */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={onEditName ? `${displayName} — change name` : displayName}
              onClick={onEditName}
              disabled={!onEditName}
              className="h-auto gap-2.5 py-2 disabled:opacity-100 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
            >
              <Avatar className="size-7 shrink-0 rounded-lg">
                <AvatarFallback className="rounded-lg border border-sidebar-border bg-sidebar-accent text-[11px] font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {/* flex-1 would keep claiming width in the collapsed rail and
                  shove the avatar off centre, so drop the block entirely. */}
              <span className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium">{displayName}</span>
                {secondaryLine && (
                  <span className="truncate text-xs font-normal text-muted-foreground">
                    {secondaryLine}
                  </span>
                )}
              </span>
              {onEditName && (
                <Pencil className="ml-auto shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/menu-button:opacity-100 group-data-[collapsible=icon]:hidden" />
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={isDark ? "Light mode" : "Dark mode"}
              onClick={onToggleDarkMode}
              className="text-muted-foreground"
            >
              {isDark ? <Sun /> : <Moon />}
              <span>{isDark ? "Light mode" : "Dark mode"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              className="text-muted-foreground"
              render={<a href="/auth/logout" />}
            >
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
