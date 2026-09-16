import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { CartDrawer } from "@/components/cart/CartDrawer";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { Footer } from "./Footer";
import { Header } from "./Header";

/**
 * Storefront chrome. Admin routes render their own shell, so the header,
 * footer and shopper panels are skipped there.
 */
export function Storefront({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <SearchOverlay />
      <CartDrawer />
    </div>
  );
}
