-- Merge Americano variants
-- First, delete the existing variants
DELETE FROM items WHERE names->>'en' = 'Americano';
DELETE FROM items WHERE names->>'en' = 'Americano Medium';
DELETE FROM items WHERE names->>'en' = 'Americano Large';
INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"Americano","tr":"Americano","ar":"Americano"}',
  120, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":120},{"size":"Medium","price":140},{"size":"Large","price":170}]'::jsonb
);

-- Merge Iced Americano variants
-- First, delete the existing variants
DELETE FROM items WHERE names->>'en' = 'Iced Americano';
DELETE FROM items WHERE names->>'en' = 'Iced Americano medium';
DELETE FROM items WHERE names->>'en' = 'Iced Americano large';
INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced Americano","tr":"Iced Americano","ar":"Iced Americano"}',
  130, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":130},{"size":"Medium","price":150},{"size":"Large","price":170}]'::jsonb
);

-- Merge Latte variants
-- First, delete the existing variants
DELETE FROM items WHERE names->>'en' = 'Latte';
DELETE FROM items WHERE names->>'en' = 'Latte Medium';
DELETE FROM items WHERE names->>'en' = 'Latte Large';
INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"Latte","tr":"Latte","ar":"Latte"}',
  140, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":140},{"size":"Medium","price":160},{"size":"Large","price":200}]'::jsonb
);

-- Merge Iced Latte variants
-- First, delete the existing variants
DELETE FROM items WHERE names->>'en' = 'Iced Latte';
DELETE FROM items WHERE names->>'en' = 'Iced Latte Medium';
DELETE FROM items WHERE names->>'en' = 'Iced Latte Large';
INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced Latte","tr":"Iced Latte","ar":"Iced Latte"}',
  160, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":160},{"size":"Medium","price":180},{"size":"Large","price":200}]'::jsonb
);

-- Merge Cappuccino variants
-- First, delete the existing variants
DELETE FROM items WHERE names->>'en' = 'Cappuccino';
DELETE FROM items WHERE names->>'en' = 'Cappuccino Medium';
DELETE FROM items WHERE names->>'en' = 'Cappuccino Large';
INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"Cappuccino","tr":"Cappuccino","ar":"Cappuccino"}',
  140, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":140},{"size":"Medium","price":160},{"size":"Large","price":180}]'::jsonb
);

-- Merge Mocha Latte variants
-- First, delete the existing variants
DELETE FROM items WHERE names->>'en' = 'Mocha Latte';
DELETE FROM items WHERE names->>'en' = 'Mocha Latte Medium';
DELETE FROM items WHERE names->>'en' = 'Mocha Latte Large';
INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"Mocha Latte","tr":"Mocha Latte","ar":"Mocha Latte"}',
  180, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":180},{"size":"Medium","price":200},{"size":"Large","price":240}]'::jsonb
);

-- Merge Iced Mocha Latte variants
-- First, delete the existing variants
DELETE FROM items WHERE names->>'en' = 'Iced Mocha Latte';
DELETE FROM items WHERE names->>'en' = 'Iced Mocha Latte Medium';
DELETE FROM items WHERE names->>'en' = 'Iced Mocha Latte Large';
INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced Mocha Latte","tr":"Iced Mocha Latte","ar":"Iced Mocha Latte"}',
  200, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":200},{"size":"Medium","price":220},{"size":"Large","price":240}]'::jsonb
);

-- Merge Caramel Latte variants
-- First, delete the existing variants
DELETE FROM items WHERE names->>'en' = 'Caramel Latte';
DELETE FROM items WHERE names->>'en' = 'Caramel Latte Medium';
DELETE FROM items WHERE names->>'en' = 'Caramel Latte Large';
INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"Caramel Latte","tr":"Caramel Latte","ar":"Caramel Latte"}',
  180, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":180},{"size":"Medium","price":200},{"size":"Large","price":220}]'::jsonb
);

-- Merge Iced Caramel Latte variants
-- First, delete the existing variants
DELETE FROM items WHERE names->>'en' = 'Iced Caramel Latte';
DELETE FROM items WHERE names->>'en' = 'Iced Caramel Latte Medium';
DELETE FROM items WHERE names->>'en' = 'Iced Caramel Latte Large';
INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced Caramel Latte","tr":"Iced Caramel Latte","ar":"Iced Caramel Latte"}',
  180, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":180},{"size":"Medium","price":200},{"size":"Large","price":220}]'::jsonb
);

-- Merge Vanilla Latte variants
-- First, delete the existing variants
DELETE FROM items WHERE names->>'en' = 'Vanilla Latte';
DELETE FROM items WHERE names->>'en' = 'Vanilla Latte Medium';
DELETE FROM items WHERE names->>'en' = 'Vanilla Latte Large';
INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"Vanilla Latte","tr":"Vanilla Latte","ar":"Vanilla Latte"}',
  160, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":160},{"size":"Medium","price":180},{"size":"Large","price":220}]'::jsonb
);

-- Merge Iced Vanilla Latte variants
-- First, delete the existing variants
DELETE FROM items WHERE names->>'en' = 'Iced Vanilla Latte';
DELETE FROM items WHERE names->>'en' = 'Iced Vanilla Latte Medium';
DELETE FROM items WHERE names->>'en' = 'Iced Vanilla Latte Large';
INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced Vanilla Latte","tr":"Iced Vanilla Latte","ar":"Iced Vanilla Latte"}',
  180, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":180},{"size":"Medium","price":200},{"size":"Large","price":220}]'::jsonb
);

-- Merge Filter Coffee variants
-- First, delete the existing variants
DELETE FROM items WHERE names->>'en' = 'Filter Coffee';
DELETE FROM items WHERE names->>'en' = 'Filter Coffee Medium';
DELETE FROM items WHERE names->>'en' = 'Filter Coffee Large';
INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"Filter Coffee","tr":"Filter Coffee","ar":"Filter Coffee"}',
  140, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":140},{"size":"Medium","price":160},{"size":"Large","price":180}]'::jsonb
);

-- Merge Iced Filter Coffee variants
-- First, delete the existing variants
DELETE FROM items WHERE names->>'en' = 'Iced Filter Coffee';
DELETE FROM items WHERE names->>'en' = 'Iced Filter Coffee Medium';
DELETE FROM items WHERE names->>'en' = 'Iced Filter Coffee Large';
INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced Filter Coffee","tr":"Iced Filter Coffee","ar":"Iced Filter Coffee"}',
  125, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":125},{"size":"Medium","price":130},{"size":"Large","price":145}]'::jsonb
);

-- Merge Filter Coffee with Milk variants
-- First, delete the existing variants
DELETE FROM items WHERE names->>'en' = 'Filter Coffee with Milk';
DELETE FROM items WHERE names->>'en' = 'Filter Coffee with Milk Medium';
DELETE FROM items WHERE names->>'en' = 'Filter Coffee with Milk Large';
INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"Filter Coffee with Milk","tr":"Filter Coffee with Milk","ar":"Filter Coffee with Milk"}',
  160, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":160},{"size":"Medium","price":180},{"size":"Large","price":220}]'::jsonb
);

-- Merge Iced Filter Coffee with Milk variants
-- First, delete the existing variants
DELETE FROM items WHERE names->>'en' = 'Iced Filter Coffee with Milk';
DELETE FROM items WHERE names->>'en' = 'Iced Filter Coffee with Milk Medium';
DELETE FROM items WHERE names->>'en' = 'Iced Filter Coffee with Milk Large';
INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced Filter Coffee with Milk","tr":"Iced Filter Coffee with Milk","ar":"Iced Filter Coffee with Milk"}',
  140, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":140},{"size":"Medium","price":160},{"size":"Large","price":180}]'::jsonb
);

