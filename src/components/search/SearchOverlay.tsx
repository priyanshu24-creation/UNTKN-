import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { useUI } from "@/components/providers/UIProvider";
import { formatPrice } from "@/lib/format";
import { searchQuery } from "@/lib/queries";

const EASE = [0.16, 1, 0.3, 1] as const;

export function SearchOverlay() {
  const { panel, close } = useUI();
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 280);
    return () => clearTimeout(id);
  }, [term]);

  useEffect(() => {
    if (panel === "search") {
      const id = setTimeout(() => inputRef.current?.focus(), 220);
      return () => clearTimeout(id);
    }
    setTerm("");
    setDebounced("");
    return undefined;
  }, [panel]);

  const results = useQuery(searchQuery(debounced));
  const showEmpty =
    debounced.trim().length >= 2 && !results.isFetching && (results.data?.length ?? 0) === 0;

  return (
    <AnimatePresence>
      {panel === "search" && (
        <motion.div
          key="search"
          role="dialog"
          aria-modal="true"
          aria-label="Search products"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="fixed inset-0 z-[60] bg-background"
        >
          <motion.div
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="flex h-full flex-col"
          >
            <div className="shell flex h-16 items-center justify-between md:h-20">
              <p className="label-xs text-muted-foreground">Search</p>
              <button
                type="button"
                onClick={close}
                aria-label="Close search"
                className="grid size-10 place-items-center transition-opacity hover:opacity-60"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="shell hairline-b pb-6">
              <div className="flex items-center gap-4">
                <Search className="size-5 shrink-0 text-muted-foreground" />
                <label htmlFor="search-input" className="sr-only">
                  Search products
                </label>
                <input
                  id="search-input"
                  ref={inputRef}
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="What are you looking for?"
                  className="w-full bg-transparent font-display text-3xl tracking-[-0.01em] outline-none placeholder:text-muted-foreground md:text-5xl"
                />
                {term && (
                  <button
                    type="button"
                    onClick={() => setTerm("")}
                    className="label-xs shrink-0 text-muted-foreground link-rule"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="shell flex-1 overflow-y-auto py-8">
              {results.isFetching && (
                <p className="label-xs text-muted-foreground" role="status">
                  Searching…
                </p>
              )}

              {results.isError && (
                <p className="text-sm text-signal" role="alert">
                  Search is unavailable right now. Please try again.
                </p>
              )}

              {showEmpty && (
                <div>
                  <p className="font-display text-2xl">No matches for “{debounced}”</p>
                  <Link to="/shop" onClick={close} className="mt-4 inline-block label-xs link-rule">
                    Browse everything
                  </Link>
                </div>
              )}

              {!!results.data?.length && (
                <ul className="divide-y divide-border">
                  {results.data.map((product, i) => (
                    <motion.li
                      key={product.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.04, ease: EASE }}
                    >
                      <Link
                        to="/products/$slug"
                        params={{ slug: product.slug }}
                        onClick={close}
                        className="group flex items-center gap-5 py-4"
                      >
                        <div className="h-24 w-20 shrink-0 overflow-hidden bg-muted">
                          {product.images[0] && (
                            <img
                              src={product.images[0].image_url}
                              alt=""
                              className="photo transition-transform duration-700 group-hover:scale-105"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-sans text-sm">{product.name}</p>
                          <p className="mt-1.5 label-xs text-muted-foreground">
                            {product.category?.name ?? "Collection"}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm tabular-nums">
                          {formatPrice(product.sale_price ?? product.base_price)}
                        </p>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
