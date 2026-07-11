"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  ANZEN_THEME_CHANGE_EVENT,
  applyDocumentTheme,
  getAnzenTheme,
  readStoredDarkMode,
  writeStoredDarkMode,
  type AnzenTheme,
} from "@/components/anzen-theme";

type AnzenThemeContextValue = {
  theme: AnzenTheme;
  isDark: boolean;
  setDarkMode: (isDark: boolean) => void;
  toggleDarkMode: () => void;
};

const AnzenThemeContext = createContext<AnzenThemeContextValue | null>(null);

export function AnzenThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(readStoredDarkMode);
  const pathname = usePathname();

  const syncFromStorage = useCallback(() => {
    setIsDark(readStoredDarkMode());
  }, []);

  const setDarkMode = useCallback((next: boolean) => {
    writeStoredDarkMode(next);
    setIsDark(next);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDark((current) => {
      const next = !current;
      writeStoredDarkMode(next);
      return next;
    });
  }, []);

  useEffect(() => {
    applyDocumentTheme(isDark);
  }, [isDark]);

  // Re-read preference after client navigations (e.g. soft nav from another tab's write).
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) syncFromStorage();
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, syncFromStorage]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "anzen-dark-mode") syncFromStorage();
    };

    const onThemeChange = (event: Event) => {
      const detail = (event as CustomEvent<{ isDark?: boolean }>).detail;
      if (typeof detail?.isDark === "boolean") {
        setIsDark(detail.isDark);
      } else {
        syncFromStorage();
      }
    };

    const onPageShow = () => syncFromStorage();

    window.addEventListener("storage", onStorage);
    window.addEventListener(ANZEN_THEME_CHANGE_EVENT, onThemeChange);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(ANZEN_THEME_CHANGE_EVENT, onThemeChange);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [syncFromStorage]);

  const value = useMemo(
    () => ({
      theme: getAnzenTheme(isDark),
      isDark,
      setDarkMode,
      toggleDarkMode,
    }),
    [isDark, setDarkMode, toggleDarkMode]
  );

  return <AnzenThemeContext.Provider value={value}>{children}</AnzenThemeContext.Provider>;
}

export function useAnzenTheme(): AnzenThemeContextValue {
  const context = useContext(AnzenThemeContext);
  if (!context) {
    throw new Error("useAnzenTheme must be used within AnzenThemeProvider");
  }
  return context;
}
