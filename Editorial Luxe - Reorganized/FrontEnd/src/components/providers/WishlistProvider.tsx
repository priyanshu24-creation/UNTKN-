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

import { loadServerWishlist, saveServerWishlist } from "@backend/lib/wishlist.functions";
import { useAuth } from "./AuthProvider";

const STORAGE_KEY = "untkn.wishlist.v1";

function readLocal(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? [...new Set(parsed.filter((v) => typeof v === "string"))] : [];
  } catch {
    return [];
  }
}

type WishlistState = {
  productIds: string[];
  has: (productId: string) => boolean;
  toggle: (productId: string) => void;
  remove: (productId: string) => void;
  count: number;
};

const WishlistContext = createContext<WishlistState | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [productIds, setProductIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const mergedForUser = useRef<string | null>(null);

  useEffect(() => {
    setProductIds(readLocal());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(productIds));
  }, [productIds, hydrated]);

  useEffect(() => {
    if (!hydrated || loading || !user) return;
    if (mergedForUser.current === user.id) return;
    mergedForUser.current = user.id;

    (async () => {
      try {
        const remote = await loadServerWishlist();
        const merged = [...new Set([...remote, ...readLocal()])];
        setProductIds(merged);
        await saveServerWishlist({ data: { productIds: merged } });
      } catch {
        /* keep the local wishlist */
      }
    })();
  }, [user, loading, hydrated]);

  useEffect(() => {
    if (!user) mergedForUser.current = null;
  }, [user]);

  const commit = useCallback(
    (next: string[]) => {
      setProductIds(next);
      if (user) saveServerWishlist({ data: { productIds: next } }).catch(() => {});
    },
    [user],
  );

  const value = useMemo<WishlistState>(
    () => ({
      productIds,
      count: productIds.length,
      has: (id) => productIds.includes(id),
      toggle: (id) =>
        commit(productIds.includes(id) ? productIds.filter((p) => p !== id) : [...productIds, id]),
      remove: (id) => commit(productIds.filter((p) => p !== id)),
    }),
    [productIds, commit],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
