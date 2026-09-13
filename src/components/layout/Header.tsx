import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { useUI } from "@/components/providers/UIProvider";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { useSiteConfig } from "@/components/ui/SiteConfigProvider";
import { cn } from "@/lib/utils";
import { MobileNav } from "./MobileNav";

export function Header() {
  const config = useSiteConfig();
  const { panel, open, toggle, close } = useUI();
  const cart = useCart();
  const wishlist = useWishlist();
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [scrolled, setScrolled] = useState(false);

  const transparent = pathname === "/" && !scrolled && panel !== "menu";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const iconClass =
    "relative grid h-9 w-9 place-items-center transition-opacity duration-200 hover:opacity-55";

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,color,border-color,backdrop-filter] duration-300",
          transparent
            ? "border-transparent bg-transparent text-paper"
            : "border-b border-black/8 bg-paper/92 text-ink backdrop-blur-md",
        )}
      >
        <div className="shell flex h-14 items-center justify-between gap-3 md:h-[4.5rem]">
          <div className="flex flex-1 items-center md:hidden">
            <button
              type="button"
              onClick={() => toggle("menu")}
              aria-label={panel === "menu" ? "Close menu" : "Open menu"}
              aria-expanded={panel === "menu"}
              className={iconClass}
            >
              {panel === "menu" ? <X className="size-[17px]" /> : <Menu className="size-[17px]" />}
            </button>
          </div>

          <div className="flex flex-1 items-center">
            <Link to="/" onClick={close} className="font-display text-[1.35rem] tracking-[0.2em]">
              {config.brand.wordmark}
            </Link>
          </div>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
            {config.nav.primary.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="label-xs link-rule"
                data-active={pathname.startsWith(item.to) ? "true" : "false"}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-0">
            <button type="button" onClick={() => open("search")} aria-label="Search" className={iconClass}>
              <Search className="size-[17px]" />
            </button>
            <Link
              to={user ? "/account" : "/auth/signin"}
              aria-label={user ? "Account" : "Sign in"}
              className={cn(iconClass, "hidden md:grid")}
            >
              <User className="size-[17px]" />
            </Link>
            <Link
              to="/account/wishlist"
              aria-label={`Wishlist, ${wishlist.count} items`}
              className={cn(iconClass, "hidden md:grid")}
            >
              <Heart className="size-[17px]" />
              {wishlist.count > 0 && <Dot />}
            </Link>
            <button type="button" onClick={() => open("cart")} aria-label={`Cart, ${cart.count} items`} className={iconClass}>
              <ShoppingBag className="size-[17px]" />
              <AnimatePresence>
                {cart.count > 0 && (
                  <motion.span
                    key={cart.count}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    className="absolute right-1 top-0.5 text-[9px] tabular-nums"
                  >
                    {cart.count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>
      <MobileNav />
    </>
  );
}

function Dot() {
  return <span className="absolute right-1.5 top-1.5 size-1 rounded-full bg-signal" />;
}
