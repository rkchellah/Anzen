"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Link2,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Plus,
  ShieldCheck,
  Sun,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { AnzenLogo } from "@/components/AnzenLogo";
import type { StoredChat } from "@/lib/chat-history";
import { resolveDisplayName } from "@/lib/display-name";
import { cn } from "@/lib/utils";

export type DashboardPage = "chat" | "connections" | "activity" | "privacy";

const COLLAPSE_KEY = "anzen.sidebar.collapsed";

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
  mobileOpen,
  onCloseMobile,
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
  mobileOpen: boolean;
  onCloseMobile: () => void;
  userName?: string;
  userEmail?: string;
  chats?: StoredChat[];
  activeChatId?: string | null;
  onSelectChat?: (id: string) => void;
  onDeleteChat?: (id: string) => void;
}) {
  const identity = resolveDisplayName(userName, userEmail);
  const [chatsExpanded, setChatsExpanded] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  // Restore the desktop rail state; mobile always renders the full drawer.
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "true");
    } catch {
      // Ignore storage failures.
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, String(next));
      } catch {
        // Ignore storage failures.
      }
      return next;
    });
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="anzen-sidebar-scrim"
          role="presentation"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          "anzen-sidebar",
          mobileOpen && "anzen-sidebar-open",
          collapsed && "anzen-sidebar-collapsed"
        )}
        aria-label="Dashboard navigation"
      >
        <div className="anzen-sidebar-brand">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className="flex min-w-0 cursor-pointer items-center gap-2.5 border-none bg-transparent p-0"
            title="Anzen — new chat"
          >
            <AnzenLogo size={28} />
            <span className="anzen-collapsible-label text-[17px] font-semibold tracking-[-0.02em] text-foreground">
              Anzen
            </span>
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleCollapsed}
              className="anzen-sidebar-collapse-btn"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>

            <button
              type="button"
              onClick={onCloseMobile}
              className="anzen-sidebar-close cursor-pointer border-none bg-transparent p-0 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="anzen-scrollbar flex-1 overflow-y-auto px-1 pb-4" aria-label="Main sections">
          <p className="anzen-sidebar-section-label anzen-collapsible-label">Workspace</p>
          <div className="flex flex-col gap-0.5">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const active = activePage === id;
              const isChats = id === "chat";
              return (
                <div key={id}>
                  <div className="anzen-sidebar-row">
                    {isChats && !collapsed && (
                      <button
                        type="button"
                        onClick={() => setChatsExpanded((current) => !current)}
                        className="anzen-sidebar-twisty"
                        aria-expanded={chatsExpanded}
                        aria-controls="anzen-chat-list"
                        aria-label={chatsExpanded ? "Collapse chats" : "Expand chats"}
                        title={chatsExpanded ? "Collapse chats" : "Expand chats"}
                      >
                        <ChevronRight
                          size={15}
                          className={cn("transition-transform", chatsExpanded && "rotate-90")}
                        />
                      </button>
                    )}
                    {!isChats && !collapsed && (
                      <span className="anzen-sidebar-twisty-spacer" aria-hidden />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate(id);
                        onCloseMobile();
                      }}
                      className={cn(
                        "anzen-sidebar-link",
                        active && "anzen-sidebar-link-active"
                      )}
                      title={label}
                    >
                      <Icon size={17} />
                      <span className="anzen-collapsible-label flex-1 text-left">{label}</span>
                      {id === "connections" && !statusLoading && (
                        <span className="anzen-collapsible-label text-[12.5px] tabular-nums text-caption">
                          {connectedCount}/3
                        </span>
                      )}
                    </button>

                    {/* New chat lives inside Chats rather than as its own entry. */}
                    {isChats && !collapsed && (
                      <button
                        type="button"
                        onClick={() => {
                          onNewChat();
                          onCloseMobile();
                        }}
                        className="anzen-sidebar-action"
                        aria-label="Start a new chat"
                        title="New chat"
                      >
                        <Plus size={16} />
                      </button>
                    )}
                  </div>

                  {isChats && chatsExpanded && !collapsed && (
                    <div className="anzen-chat-list" id="anzen-chat-list">
                      {chats.length === 0 ? (
                        <p className="anzen-chat-empty">No chats yet</p>
                      ) : (
                        chats.map((chat) => {
                          const current = chat.id === activeChatId && activePage === "chat";
                          return (
                            <div
                              key={chat.id}
                              className={cn(
                                "anzen-chat-item",
                                current && "anzen-chat-item-active"
                              )}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectChat?.(chat.id);
                                  onCloseMobile();
                                }}
                                className="anzen-chat-item-btn"
                                aria-current={current ? "true" : undefined}
                                title={chat.title}
                              >
                                {chat.title}
                              </button>
                              {onDeleteChat && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteChat(chat.id)}
                                  className="anzen-chat-item-delete"
                                  aria-label={`Delete chat: ${chat.title}`}
                                  title="Delete chat"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        <div className="anzen-sidebar-footer px-1">
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="anzen-sidebar-link"
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
            <span className="anzen-collapsible-label flex-1 text-left">
              {isDark ? "Light mode" : "Dark mode"}
            </span>
          </button>

          <a
            href={signOutHref}
            className="anzen-sidebar-link anzen-sidebar-link-danger"
            title="Sign out"
          >
            <LogOut size={17} />
            <span className="anzen-collapsible-label flex-1 text-left">Sign out</span>
          </a>

          <div className="anzen-sidebar-user mt-1 flex items-center gap-3 rounded-xl px-2 py-2">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-[12.5px] font-semibold text-foreground"
              title={identity.full}
            >
              {identity.initials}
            </div>
            <div className="anzen-collapsible-label min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium text-foreground">
                {identity.first ?? identity.full}
              </p>
              {userEmail && identity.first && (
                <p className="truncate text-[12.5px] text-caption">{userEmail}</p>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function AnzenMobileMenuButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
      aria-label="Open menu"
    >
      <Menu size={20} />
    </button>
  );
}
