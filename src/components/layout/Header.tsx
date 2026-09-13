import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, User, X, Heart } from "lucide-react";
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

  const overlayRoute = pathname === "/" || pathname === "/lookbook";
  const transparent = overlayRoute && !scrolled && panel !== "menu";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const iconClass =
    "relative grid h-10 w-10 place-items-center transition-all duration-300 hover:opacity-60";

  return (
    <>
      <header
        className={cn(
          "fixed z-50 transition-[top,left,right,background-color,color,border-color,backdrop-filter,box-shadow] duration-500",
          transparent
            ? "left-2 right-2 top-2 rounded-[14px] border border-transparent bg-transparent text-paper md:left-4 md:right-4 md:top-4"
            : "inset-x-0 top-0 border-b border-hairline bg-background/90 text-foreground backdrop-blur-xl",
        )}
      >
        <div className="shell flex h-16 items-center justify-between gap-4 md:h-[4.5rem]">
          <div className="flex flex-1 items-center gap-1 md:hidden">
            <button
              type="button"
              onClick={() => toggle("menu")}
              aria-label={panel === "menu" ? "Close menu" : "Open menu"}
              aria-expanded={panel === "menu"}
              className={iconClass}
            >
              {panel === "menu" ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
            </button>
          </div>

          <div className="hidden flex-1 md:block">
            <Link to="/" className="inline-flex items-center" onClick={close} aria-label="UNTKN home">
              <span className="font-display text-[1.7rem] leading-none tracking-[0.24em]">
                {config.brand.wordmark}
              </span>
            </Link>
          </div>

          <Link to="/" className="md:hidden" onClick={close} aria-label="UNTKN home">
            <span className="font-display text-[1.25rem] leading-none tracking-[0.2em]">
              {config.brand.wordmark}
            </span>
          </Link>

          <nav className="hidden items-center gap-9 md:flex" aria-label="Main">
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

          <div className="flex flex-1 items-center justify-end gap-0 md:gap-0.5">
            <button type="button" onClick={() => open("search")} aria-label="Search" className={iconClass}>
              <Search className="size-[18px]" strokeWidth={1.6} />
            </button>
            <Link
              to={user ? "/account" : "/auth/signin"}
              aria-label={user ? "Account" : "Sign in"}
              className={cn(iconClass, "hidden md:grid")}
            >
              <User className="size-[18px]" strokeWidth={1.6} />
            </Link>
            <Link
              to="/account/wishlist"
              aria-label={`Wishlist, ${wishlist.count} items`}
              className={cn(iconClass, "hidden md:grid")}
            >
              <Heart className="size-[18px]" strokeWidth={1.6} />
              {wishlist.count > 0 && <Dot />}
            </Link>
            <button
              type="button"
              onClick={() => open("cart")}
              aria-label={`Cart, ${cart.count} items`}
              className={iconClass}
            >
              <ShoppingBag className="size-[18px]" strokeWidth={1.6} />
              <AnimatePresence>
                {cart.count > 0 && (
                  <motion.span
                    key={cart.count}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-1 top-1.5 font-sans text-[0.625rem] tabular-nums"
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
  return <span className="absolute right-2 top-2 size-1 rounded-full bg-signal" />;
}
