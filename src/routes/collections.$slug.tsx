import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { ProductCard } from "@/components/shop/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { siteConfig } from "@/config/site";
import { categoryQuery, productsQuery } from "@/lib/queries";

export const Route = createFileRoute("/collections/$slug")({
  loader: async ({ context, params }) => {
    const [category] = await Promise.all([
      context.queryClient.ensureQueryData(categoryQuery(params.slug)),
      context.queryClient.ensureQueryData(productsQuery({ category: params.slug })),
    ]);
    return { category };
  },
  head: ({ loaderData }) => {
    const category = loaderData?.category;
    const title = category ? `${category.name} — UNTKN` : "Collection — UNTKN";
    const description = category?.description ?? siteConfig.seo.defaultDescription;
    const image = category?.image_url;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(image && image.startsWith("https://")
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
    };
  },
  errorComponent: () => (
    <div className="shell py-40 text-center">
      <h1 className="display-md">This collection is unavailable</h1>
      <p className="mt-4 text-sm text-muted-foreground">Please try again in a moment.</p>
    </div>
  ),
  component: CollectionPage,
});

function CollectionPage() {
  const { slug } = Route.useParams();
  const { data: category } = useSuspenseQuery(categoryQuery(slug));
  const { data: products } = useSuspenseQuery(productsQuery({ category: slug }));

  if (!category) {
    return (
      <div className="shell py-40 text-center">
        <p className="label-xs text-muted-foreground">404</p>
        <h1 className="display-md mt-4">No such collection</h1>
        <Link to="/collections" className="mt-8 inline-block label-xs link-rule">
          All Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-28 md:pt-40">
      <header className="shell max-w-3xl">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 label-xs text-muted-foreground">
            <li>
              <Link to="/collections" className="link-rule">
                Collections
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-foreground">{category.name}</li>
          </ol>
        </nav>
        <h1 className="display-lg mt-6">{category.name}</h1>
        {category.description && (
          <p className="mt-8 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {category.description}
          </p>
        )}
      </header>

      {products.length === 0 ? (
        <div className="shell mt-24 pb-40">
          <p className="text-sm text-muted-foreground">
            This collection is sold out. See what else is live in the{" "}
            <Link to="/shop" search={{}} className="link-rule">
              shop
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="shell mt-20 grid grid-cols-2 gap-x-4 gap-y-12 pb-40 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
          {products.map((product, i) => (
            <Reveal key={product.id} delay={i * 0.05}>
              <ProductCard product={product} collectionHover />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
