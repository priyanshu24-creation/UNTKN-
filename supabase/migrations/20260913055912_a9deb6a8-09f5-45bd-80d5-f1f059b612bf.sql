-- sizes & colors
INSERT INTO public.sizes (name, sort_order) VALUES
  ('S', 1), ('M', 2), ('L', 3), ('XL', 4);

INSERT INTO public.colors (name, hex_code, sort_order) VALUES
  ('Off White', '#F4F1EA', 1);

-- capsule collections
INSERT INTO public.categories (name, slug, description, image_url, sort_order, active) VALUES
  ('Misery World', 'misery-world',
   'Wild-west iconography on heavyweight waffle knit. Three horses, one crest, printed sleeve to sleeve.',
   '/__l5e/assets-v1/c648d86b-c4d9-43a5-8f28-730688a7b057/Picture_4.jpg', 1, true),
  ('Dragon Flame', 'dragon-flame',
   'Hand-drawn dragons and flame work in four colours, wrapping the body and both sleeves.',
   '/__l5e/assets-v1/95002814-7050-4064-bc48-995208f1f7f2/Picture_7.jpg', 2, true);

-- products
INSERT INTO public.products (category_id, name, slug, short_description, description, base_price, sale_price, currency, featured, published, materials, care_instructions, seo_title, seo_description)
VALUES
  ((SELECT id FROM public.categories WHERE slug = 'misery-world'),
   'Misery World Waffle Thermal',
   'misery-world-waffle-thermal',
   'Boxy waffle-knit long sleeve with a full-front wild-west crest and printed sleeves.',
   E'A boxy, drop-shoulder long sleeve cut from heavyweight cotton waffle knit. The front carries the MISERY WORLD crest — three horses breaking out of a red field, distressed by hand — with RIDE WITH PRIDE arched beneath it. Both sleeves are printed full length with the wordmark.\n\nCut deliberately wide through the body and cropped short at the hem so it stacks cleanly over wide-leg trousers. Ribbed crew neck and cuffs. Printed in short runs; once a run sells through it is not reprinted.',
   2699, 2299, 'INR', true, true,
   E'100% cotton waffle thermal knit, 320 GSM. Water-based screen print. Ribbed crew neck and cuffs.',
   E'Machine wash cold, inside out. Do not bleach. Tumble dry low or line dry in shade. Do not iron directly over the print.',
   'Misery World Waffle Thermal — UNTKN',
   'Boxy heavyweight waffle-knit long sleeve with the hand-distressed Misery World crest and full-length printed sleeves.'),

  ((SELECT id FROM public.categories WHERE slug = 'dragon-flame'),
   'Dragon Flame Waffle Thermal',
   'dragon-flame-waffle-thermal',
   'Off-white waffle thermal wrapped in four-colour dragon and flame artwork.',
   E'Hand-drawn dragons rising through red and yellow flame, with cobalt smoke breaking across the chest. The artwork continues off the body and down both sleeves so the piece reads as one image when worn.\n\nSame boxy drop-shoulder block as the rest of the thermal programme: wide through the chest, cropped at the hem, ribbed crew neck and cuffs. Four-colour water-based print on heavyweight cotton waffle knit.',
   2799, NULL, 'INR', true, true,
   E'100% cotton waffle thermal knit, 320 GSM. Four-colour water-based screen print. Ribbed crew neck and cuffs.',
   E'Machine wash cold, inside out. Do not bleach. Tumble dry low or line dry in shade. Do not iron directly over the print.',
   'Dragon Flame Waffle Thermal — UNTKN',
   'Off-white heavyweight waffle thermal with four-colour hand-drawn dragon and flame artwork across the body and sleeves.');

-- product images
INSERT INTO public.product_images (product_id, image_url, alt_text, sort_order, is_primary)
SELECT p.id, v.url, v.alt, v.ord, v.prim
FROM public.products p
JOIN (VALUES
  ('/__l5e/assets-v1/03653b0f-baaf-4c45-a82c-6ba625801513/Picture_2.jpg', 'Misery World waffle thermal laid flat, front view with the red crest and three horses', 1, true),
  ('/__l5e/assets-v1/c648d86b-c4d9-43a5-8f28-730688a7b057/Picture_4.jpg', 'Model wearing the Misery World thermal beside a window, sleeve print visible', 2, false),
  ('/__l5e/assets-v1/10a17241-71dd-4fbf-a03d-07692d538cf2/Picture_3.jpg', 'Model seated on a black ledge wearing the Misery World thermal with black trousers', 3, false),
  ('/__l5e/assets-v1/7151641f-1061-479b-84e6-e3d3f47a1722/Picture_8.jpg', 'Overhead shot of the Misery World thermal on patterned paving', 4, false),
  ('/__l5e/assets-v1/18cfd065-e5e7-4935-ab7d-86359729a090/Picture_5.jpg', 'Model leaning against a painted mural wearing the Misery World thermal', 5, false)
) AS v(url, alt, ord, prim) ON true
WHERE p.slug = 'misery-world-waffle-thermal';

INSERT INTO public.product_images (product_id, image_url, alt_text, sort_order, is_primary)
SELECT p.id, v.url, v.alt, v.ord, v.prim
FROM public.products p
JOIN (VALUES
  ('/__l5e/assets-v1/e15a7fd2-3de6-43b0-b1e6-58abc1c05c90/Picture_1.jpg', 'Dragon Flame waffle thermal laid flat, front view with dragon and flame artwork', 1, true),
  ('/__l5e/assets-v1/95002814-7050-4064-bc48-995208f1f7f2/Picture_7.jpg', 'Model wearing the Dragon Flame thermal in front of a graffiti wall', 2, false),
  ('/__l5e/assets-v1/f3637ed5-e353-480a-acaa-b5fa854f627a/Picture_6.jpg', 'Model reclining on a stairwell wearing the Dragon Flame thermal', 3, false)
) AS v(url, alt, ord, prim) ON true
WHERE p.slug = 'dragon-flame-waffle-thermal';

-- variants: one per size in Off White
INSERT INTO public.product_variants (product_id, sku, size_id, color_id, price, stock_quantity, active)
SELECT p.id,
       'UN-MWT-OW-' || s.name,
       s.id,
       (SELECT id FROM public.colors WHERE name = 'Off White'),
       NULL,
       v.stock,
       true
FROM public.products p
JOIN public.sizes s ON true
JOIN (VALUES ('S', 6), ('M', 12), ('L', 9), ('XL', 3)) AS v(size_name, stock) ON v.size_name = s.name
WHERE p.slug = 'misery-world-waffle-thermal';

INSERT INTO public.product_variants (product_id, sku, size_id, color_id, price, stock_quantity, active)
SELECT p.id,
       'UN-DFT-OW-' || s.name,
       s.id,
       (SELECT id FROM public.colors WHERE name = 'Off White'),
       NULL,
       v.stock,
       true
FROM public.products p
JOIN public.sizes s ON true
JOIN (VALUES ('S', 4), ('M', 10), ('L', 8), ('XL', 2)) AS v(size_name, stock) ON v.size_name = s.name
WHERE p.slug = 'dragon-flame-waffle-thermal';

-- homepage content
INSERT INTO public.homepage_sections
  (section_key, eyebrow, title, subtitle, body, image_url, secondary_image_url, cta_label, cta_href, secondary_cta_label, secondary_cta_href, sort_order, active)
VALUES
  ('hero', 'Capsule 01 — Waffle Programme', 'Ride With Pride',
   'Heavyweight waffle thermals, printed sleeve to sleeve, made in short runs and never reprinted.',
   NULL,
   '/__l5e/assets-v1/18cfd065-e5e7-4935-ab7d-86359729a090/Picture_5.jpg',
   '/__l5e/assets-v1/c648d86b-c4d9-43a5-8f28-730688a7b057/Picture_4.jpg',
   'Shop Collection', '/shop', 'Explore Lookbook', '/lookbook', 1, true),

  ('featured_collection', 'Featured Collection', 'Misery World',
   'Wild west, hand distressed',
   'Three horses breaking out of a red field, arched type above and below, wordmark down both sleeves. Cut boxy and cropped so it stacks over wide-leg trousers.',
   '/__l5e/assets-v1/7151641f-1061-479b-84e6-e3d3f47a1722/Picture_8.jpg',
   '/__l5e/assets-v1/03653b0f-baaf-4c45-a82c-6ba625801513/Picture_2.jpg',
   'Enter Collection', '/collections/misery-world', NULL, NULL, 2, true),

  ('brand_story', 'The Label', 'Unspoken by design',
   NULL,
   E'UNTKN started in a single room in Kolkata with one screen, one squeegee and a drawer of drawings nobody had asked for.\n\nWe print in runs of a few dozen. Every graphic is drawn by hand before it is separated for screen, and once a run is gone it does not come back. Nothing here is designed to be explained — only worn.',
   '/__l5e/assets-v1/f3637ed5-e353-480a-acaa-b5fa854f627a/Picture_6.jpg',
   NULL,
   'Read More', '/about', NULL, NULL, 3, true),

  ('promo', 'Limited Run', 'Dragon Flame — 24 pieces only',
   'Four-colour print, cut and printed in a single run.',
   'The dragon programme was separated across four screens and printed by hand. When this run sells through, the screens are destroyed.',
   '/__l5e/assets-v1/95002814-7050-4064-bc48-995208f1f7f2/Picture_7.jpg',
   NULL,
   'Shop Dragon Flame', '/collections/dragon-flame', NULL, NULL, 4, true),

  ('gallery', 'On The Street', 'Worn in Kolkata',
   'Campaign 01 — shot on location, unretouched.',
   NULL, NULL, NULL, 'Shop The Look', '/shop', NULL, NULL, 5, true),

  ('newsletter', 'Studio List', 'First access to every run',
   'Short runs sell out. Subscribers hear before anyone else.',
   NULL, NULL, NULL, NULL, NULL, NULL, NULL, 6, true);

-- lookbook
INSERT INTO public.lookbook_items (title, caption, image_url, product_id, span, sort_order, active) VALUES
  ('Ledge', 'Misery World thermal, black wide-leg',
   '/__l5e/assets-v1/10a17241-71dd-4fbf-a03d-07692d538cf2/Picture_3.jpg',
   (SELECT id FROM public.products WHERE slug = 'misery-world-waffle-thermal'), 'tall', 1, true),
  ('Window Light', 'Sleeve print, full length',
   '/__l5e/assets-v1/c648d86b-c4d9-43a5-8f28-730688a7b057/Picture_4.jpg',
   (SELECT id FROM public.products WHERE slug = 'misery-world-waffle-thermal'), 'normal', 2, true),
  ('Corridor', 'Shot on location, unretouched',
   '/__l5e/assets-v1/18cfd065-e5e7-4935-ab7d-86359729a090/Picture_5.jpg',
   (SELECT id FROM public.products WHERE slug = 'misery-world-waffle-thermal'), 'wide', 3, true),
  ('Stairwell', 'Dragon Flame thermal',
   '/__l5e/assets-v1/f3637ed5-e353-480a-acaa-b5fa854f627a/Picture_6.jpg',
   (SELECT id FROM public.products WHERE slug = 'dragon-flame-waffle-thermal'), 'tall', 4, true),
  ('Mural', 'Four-colour print, full wrap',
   '/__l5e/assets-v1/95002814-7050-4064-bc48-995208f1f7f2/Picture_7.jpg',
   (SELECT id FROM public.products WHERE slug = 'dragon-flame-waffle-thermal'), 'normal', 5, true),
  ('Overhead', 'Crafted with pride',
   '/__l5e/assets-v1/7151641f-1061-479b-84e6-e3d3f47a1722/Picture_8.jpg',
   (SELECT id FROM public.products WHERE slug = 'misery-world-waffle-thermal'), 'normal', 6, true);

-- settings
INSERT INTO public.site_settings (key, value) VALUES
  ('brand', '{"name":"UNTKN","tagline":"Unspoken by design"}'::jsonb),
  ('shipping', '{"flat_fee":149,"free_shipping_threshold":2999,"estimated_delivery":"3-6 working days"}'::jsonb);