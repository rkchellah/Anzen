import type { UIMessage } from "ai";

/**
 * Local chat history.
 *
 * Conversations live in the browser only — no server round-trip and nothing
 * leaves the device — so the sidebar can offer past chats without adding a
 * persistence backend.
 */

export type StoredChat = {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
};

const STORAGE_KEY = "anzen.chats.v1";
const MAX_CHATS = 50;

function isBrowser() {
  return typeof window !== "undefined";
}

export function newChatId(): string {
  if (isBrowser() && typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `chat-${Math.floor(performance.now() * 1000)}`;
}

/** First line of the first user message, trimmed to something sidebar-sized. */
export function deriveChatTitle(messages: UIMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  const text = firstUser ? messageText(firstUser) : "";
  const firstLine = text.split("\n").find((line) => line.trim().length > 0)?.trim() ?? "";
  if (!firstLine) return "New chat";
  return firstLine.length > 48 ? `${firstLine.slice(0, 47).trimEnd()}…` : firstLine;
}

export function messageText(message: UIMessage): string {
  return (message.parts ?? [])
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export function loadChats(): StoredChat[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as StoredChat[])
      .filter((chat) => chat && typeof chat.id === "string" && Array.isArray(chat.messages))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveChats(chats: StoredChat[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chats.slice(0, MAX_CHATS)));
  } catch {
    // Quota or private-mode failures shouldn't break the session.
  }
}

export function removeChat(chats: StoredChat[], id: string): StoredChat[] {
  return chats.filter((chat) => chat.id !== id);
}

/** Insert or replace `chat`, keeping the list newest-first. */
export function upsertChat(chats: StoredChat[], chat: StoredChat): StoredChat[] {
  const rest = chats.filter((existing) => existing.id !== chat.id);
  return [chat, ...rest].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_CHATS);
}
