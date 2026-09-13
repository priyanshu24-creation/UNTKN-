import { queryOptions } from "@tanstack/react-query";

import {
  getCategory,
  getProduct,
  getProductsByIds,
  getRelatedProducts,
  listCategories,
  listFilterFacets,
  listHomepageSections,
  listLookbookItems,
  listProducts,
  searchProducts,
  type ProductQuery,
} from "./catalog.functions";

export const productsQuery = (params: ProductQuery = {}) =>
  queryOptions({
    queryKey: ["products", params],
    queryFn: () => listProducts({ data: params }),
    staleTime: 60_000,
  });

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProduct({ data: { slug } }),
    staleTime: 60_000,
  });

export const relatedProductsQuery = (slug: string, categorySlug: string | null) =>
  queryOptions({
    queryKey: ["related", slug],
    queryFn: () => getRelatedProducts({ data: { slug, categorySlug } }),
    staleTime: 60_000,
  });

export const productsByIdsQuery = (ids: string[]) =>
  queryOptions({
    queryKey: ["products-by-ids", ids],
    queryFn: () => getProductsByIds({ data: { ids } }),
    staleTime: 30_000,
  });

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
    staleTime: 300_000,
  });

export const categoryQuery = (slug: string) =>
  queryOptions({
    queryKey: ["category", slug],
    queryFn: () => getCategory({ data: { slug } }),
    staleTime: 300_000,
  });

export const filterFacetsQuery = () =>
  queryOptions({
    queryKey: ["filter-facets"],
    queryFn: () => listFilterFacets(),
    staleTime: 300_000,
  });

export const homepageSectionsQuery = () =>
  queryOptions({
    queryKey: ["homepage-sections"],
    queryFn: () => listHomepageSections(),
    staleTime: 120_000,
  });

export const lookbookQuery = () =>
  queryOptions({
    queryKey: ["lookbook"],
    queryFn: () => listLookbookItems(),
    staleTime: 120_000,
  });

export const searchQuery = (q: string) =>
  queryOptions({
    queryKey: ["search", q],
    queryFn: () => searchProducts({ data: { q } }),
    enabled: q.trim().length >= 2,
    staleTime: 30_000,
  });
