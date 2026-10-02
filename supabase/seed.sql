-- Vellyshop catalogue seed.
-- Run after schema.sql. Re-running updates the rows rather than duplicating them.
--
-- The photographs below are stand-ins from Unsplash so the shop is browsable
-- today. Replace every image_url with a real photo of the stock before this
-- goes to customers.

insert into public.products
  (slug, name, tagline, description, price_kobo, image_url, category, sizes, colour)
values
  ('fringe-knit-poncho',
   'Fringe Knit Poncho',
   'Hand-finished cream knit',
   'A loose open-knit poncho in undyed cream cotton, finished by hand with a deep fringe along the hem. It throws over almost anything and settles softly at the shoulder. One size, cut generously.',
   2450000,
   'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=1200&q=80',
   'Knitwear', '{"One size"}', 'Cream'),

  ('essential-white-crew-tee',
   'Essential White Crew Tee',
   'Heavyweight combed cotton',
   'The plain white tee done properly: 220gsm combed cotton, a clean ribbed crew neck and a straight body that holds its shape after washing. Buy two.',
   890000,
   'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80',
   'Tops', '{"S","M","L","XL","XXL"}', 'White'),

  ('tartan-wool-overcoat',
   'Tartan Wool Overcoat',
   'Green and navy check',
   'A relaxed single-breasted overcoat in brushed wool, checked in deep green over navy. Dropped shoulder, two patch pockets, fully lined. Warm enough for harmattan evenings.',
   6800000,
   'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=1200&q=80',
   'Outerwear', '{"S","M","L"}', 'Green check'),

  ('camel-belted-trench',
   'Camel Belted Trench',
   'The coat that finishes the outfit',
   'A long camel trench with a wide notch lapel and a self-tie belt that lets you set the waist where you want it. Falls below the knee and moves well when you walk.',
   7450000,
   'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=1200&q=80',
   'Outerwear', '{"S","M","L","XL"}', 'Camel'),

  ('chambray-everyday-shirt',
   'Chambray Everyday Shirt',
   'Soft indigo, speckled weave',
   'A lightweight chambray shirt in washed indigo with a fine speckle through the weave. Long sleeve, curved hem, mother-of-pearl buttons. Works open over a tee or buttoned on its own.',
   1650000,
   'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200&q=80',
   'Shirts', '{"S","M","L","XL"}', 'Indigo'),

  ('washed-grey-straight-jeans',
   'Washed Grey Straight Jeans',
   'Rigid denim, straight leg',
   'Straight-leg jeans in rigid grey denim with a mid rise and a clean five-pocket build. They break in over a few wears and keep the line.',
   2200000,
   'https://images.unsplash.com/photo-1467043237213-65f2da53396f?w=1200&q=80',
   'Bottoms', '{"26","28","30","32","34","36"}', 'Washed grey'),

  ('city-red-graphic-tee',
   'City Red Graphic Tee',
   'Print on pillar-box red',
   'A boxy cotton tee in pillar-box red with a worn-in chest print. Cut short in the body so it sits right over high-waisted denim.',
   1150000,
   'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1200&q=80',
   'Tops', '{"S","M","L"}', 'Red'),

  ('sunshine-hoodie-jogger-set',
   'Sunshine Hoodie & Jogger Set',
   'Matching two-piece in marigold',
   'Cropped hoodie and tapered jogger in brushed-back marigold fleece, sold as a set. Drawcord hood, elasticated cuffs, deep side pockets on the jogger.',
   3200000,
   'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80',
   'Sets', '{"S","M","L","XL"}', 'Marigold'),

  ('floral-wrap-midi-dress',
   'Floral Wrap Midi Dress',
   'True wrap, printed cotton',
   'A real wrap dress in printed cotton, tied at the waist so it fits a range of shapes. Flutter sleeve, midi length, side slit that opens as you move.',
   2850000,
   'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&q=80',
   'Dresses', '{"S","M","L","XL"}', 'Ivory floral')

on conflict (slug) do update set
  name        = excluded.name,
  tagline     = excluded.tagline,
  description = excluded.description,
  price_kobo  = excluded.price_kobo,
  image_url   = excluded.image_url,
  category    = excluded.category,
  sizes       = excluded.sizes,
  colour      = excluded.colour;
