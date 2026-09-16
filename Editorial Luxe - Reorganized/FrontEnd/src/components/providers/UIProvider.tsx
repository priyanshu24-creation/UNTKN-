import { useRouterState } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Panel = "search" | "menu" | "cart" | null;

type UIState = {
  panel: Panel;
  open: (panel: Exclude<Panel, null>) => void;
  close: () => void;
  toggle: (panel: Exclude<Panel, null>) => void;
};

const UIContext = createContext<UIState | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [panel, setPanel] = useState<Panel>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => setPanel(null), [pathname]);

  // block background scroll while a full-surface panel is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    const blocked = panel !== null;
    document.body.style.overflow = blocked ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [panel]);

  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel]);

  const value = useMemo<UIState>(
    () => ({
      panel,
      open: (next) => setPanel(next),
      close: () => setPanel(null),
      toggle: (next) => setPanel((current) => (current === next ? null : next)),
    }),
    [panel],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside UIProvider");
  return ctx;
}
