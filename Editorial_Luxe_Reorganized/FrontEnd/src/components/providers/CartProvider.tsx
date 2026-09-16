import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { loadServerCart, resolveCart, saveServerCart } from "@backend/lib/cart.functions";
import type { CartLine, CartTotals } from "@/lib/types";
import { useAuth } from "./AuthProvider";

const STORAGE_KEY = "untkn.cart.v1";

function readLocal(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l) => typeof l?.variantId === "string" && Number.isInteger(l?.quantity) && l.quantity > 0,
    );
  } catch {
    return [];
  }
}

function mergeLines(a: CartLine[], b: CartLine[]): CartLine[] {
  const map = new Map<string, number>();
  for (const line of [...a, ...b]) {
    map.set(line.variantId, Math.min((map.get(line.variantId) ?? 0) + line.quantity, 20));
  }
  return [...map.entries()].map(([variantId, quantity]) => ({ variantId, quantity }));
}

type CartState = {
  lines: CartLine[];
  totals: CartTotals | null;
  count: number;
  isResolving: boolean;
  couponCode: string | null;
  addItem: (variantId: string, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  applyCoupon: (code: string | null) => void;
};

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const mergedForUser = useRef<string | null>(null);

  useEffect(() => {
    setLines(readLocal());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const persist = useMutation({
    mutationFn: (next: CartLine[]) => saveServerCart({ data: { lines: next } }),
  });

  // merge the guest cart into the stored cart once on sign-in
  useEffect(() => {
    if (!hydrated || authLoading || !user) return;
    if (mergedForUser.current === user.id) return;
    mergedForUser.current = user.id;

    (async () => {
      try {
        const remote = await loadServerCart();
        const merged = mergeLines(remote, readLocal());
        setLines(merged);
        await saveServerCart({ data: { lines: merged } });
      } catch {
        /* keep the local cart if the stored cart can't be read */
      }
    })();
  }, [user, authLoading, hydrated]);

  useEffect(() => {
    if (!user) mergedForUser.current = null;
  }, [user]);

  const mutate = useCallback(
    (updater: (current: CartLine[]) => CartLine[]) => {
      setLines((current) => {
        const next = updater(current).filter((l) => l.quantity > 0);
        if (user) persist.mutate(next);
        return next;
      });
    },
    [user, persist],
  );

  const totalsQuery = useQuery({
    queryKey: ["cart-totals", lines, couponCode],
    queryFn: () => resolveCart({ data: { lines, couponCode } }),
    enabled: hydrated,
    staleTime: 15_000,
  });

  // drop lines the server rejected (unpublished or out of stock)
  const serverLines = totalsQuery.data?.lines;
  useEffect(() => {
    if (!serverLines || !lines.length) return;
    const valid = new Set(serverLines.map((l) => l.variantId));
    if (lines.some((l) => !valid.has(l.variantId))) {
      setLines((current) => current.filter((l) => valid.has(l.variantId)));
    }
  }, [serverLines, lines]);

  const value = useMemo<CartState>(
    () => ({
      lines,
      totals: totalsQuery.data ?? null,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      isResolving: totalsQuery.isFetching,
      couponCode,
      addItem: (variantId, quantity = 1) =>
        mutate((current) => {
          const existing = current.find((l) => l.variantId === variantId);
          if (existing) {
            return current.map((l) =>
              l.variantId === variantId
                ? { ...l, quantity: Math.min(l.quantity + quantity, 20) }
                : l,
            );
          }
          return [...current, { variantId, quantity }];
        }),
      setQuantity: (variantId, quantity) =>
        mutate((current) =>
          current.map((l) => (l.variantId === variantId ? { ...l, quantity } : l)),
        ),
      removeItem: (variantId) => mutate((current) => current.filter((l) => l.variantId !== variantId)),
      clear: () => {
        setCouponCode(null);
        mutate(() => []);
        queryClient.invalidateQueries({ queryKey: ["cart-totals"] });
      },
      applyCoupon: (code) => setCouponCode(code ? code.trim().toUpperCase() : null),
    }),
    [lines, totalsQuery.data, totalsQuery.isFetching, couponCode, mutate, queryClient],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
