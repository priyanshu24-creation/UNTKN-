UNTKN — COLLECTION PRODUCT HOVER FIX

This patch fixes the hover image on the collection detail page only.

Problem:
The second product image was lazy-loaded. On the collection page, the user could hover before that image had loaded, making the hover state appear broken until the product was clicked.

Fix:
- Collection page prioritizes the first four product cards.
- ProductCard now eagerly loads the secondary/hover image when priority=true.
- fetchPriority=high is used for those hover images.
- No homepage, shop, lookbook, checkout, or database changes.

Replace ONLY:
src/components/shop/ProductCard.tsx
src/routes/collections.$slug.tsx

Then run:
npm run build
