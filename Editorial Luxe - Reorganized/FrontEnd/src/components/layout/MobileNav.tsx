import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

import { useAuth } from "@/components/providers/AuthProvider";
import { useUI } from "@/components/providers/UIProvider";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { useSiteConfig } from "@/components/ui/SiteConfigProvider";

const EASE = [0.16, 1, 0.3, 1] as const;

export function MobileNav() {
  const { panel, close } = useUI();
  const config = useSiteConfig();
  const { user } = useAuth();
  const wishlist = useWishlist();

  const items = [
    ...config.nav.primary,
    { label: user ? "Account" : "Sign In", to: user ? "/account" : "/auth/signin" },
    { label: `Wishlist${wishlist.count ? ` (${wishlist.count})` : ""}`, to: "/account/wishlist" },
  ];

  return (
    <AnimatePresence>
      {panel === "menu" && (
        <motion.div
          key="mobile-nav"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="fixed inset-0 z-40 flex flex-col bg-background pt-16 md:hidden"
        >
          <nav className="flex flex-1 flex-col justify-center px-6" aria-label="Mobile">
            <ul>
              {items.map((item, i) => (
                <li key={item.to} className="overflow-hidden py-1">
                  <motion.div
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "110%" }}
                    transition={{ duration: 0.55, delay: 0.05 + i * 0.06, ease: EASE }}
                  >
                    <Link
                      to={item.to}
                      onClick={close}
                      className="block font-display text-[2.75rem] leading-[1.05] tracking-[-0.02em]"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </nav>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="hairline-t px-6 py-8"
          >
            <p className="label-xs text-muted-foreground">{config.brand.tagline}</p>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {config.social.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="label-xs link-rule"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
