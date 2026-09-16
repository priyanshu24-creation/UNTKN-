import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ProductCard, ProductCardSkeleton } from "@/components/shop/ProductCard";
import { searchQuery } from "@/lib/queries";

type SearchParams = { q?: string };

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams =>
    typeof search["q"] === "string" && search["q"] ? { q: search["q"] } : {},
  head: () => ({
    meta: [
      { title: "Search — UNTKN" },
      { name: "description", content: "Search the UNTKN catalogue by name, collection or fabric." },
      { property: "og:title", content: "Search — UNTKN" },
      { property: "og:description", content: "Search the UNTKN catalogue." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [term, setTerm] = useState(q ?? "");
  const [debounced, setDebounced] = useState(q ?? "");

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(term.trim()), 300);
    return () => window.clearTimeout(id);
  }, [term]);

  useEffect(() => {
    navigate({ search: debounced ? { q: debounced } : {}, replace: true });
  }, [debounced, navigate]);

  const results = useQuery({ ...searchQuery(debounced), enabled: debounced.length > 1 });

  return (
    <div className="shell pb-40 pt-28 md:pt-40">
      <header className="hairline-b pb-8">
        <p className="label-xs text-muted-foreground">Search</p>
        <label htmlFor="site-search" className="sr-only">
          Search products
        </label>
        <input
          id="site-search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="What are you looking for?"
          autoFocus
          className="mt-6 w-full border-0 bg-transparent font-display text-3xl outline-none placeholder:text-muted-foreground md:text-5xl"
        />
      </header>

      {debounced.length <= 1 ? (
        <p className="mt-12 text-sm text-muted-foreground">
          Type at least two characters to search.
        </p>
      ) : results.isLoading ? (
        <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : results.isError ? (
        <p className="mt-12 text-sm text-signal">Search is unavailable right now.</p>
      ) : !results.data?.length ? (
        <div className="mt-12">
          <p className="text-sm text-muted-foreground">
            Nothing matched &ldquo;{debounced}&rdquo;.
          </p>
          <Link to="/shop" search={{}} className="mt-6 inline-block label-xs link-rule">
            Browse everything
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-10 label-xs text-muted-foreground">
            {results.data.length} {results.data.length === 1 ? "result" : "results"}
          </p>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
            {results.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
