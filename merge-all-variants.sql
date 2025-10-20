-- Merge ALL size variants into single items with size options

-- Merge Caramel Latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Caramel Latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Caramel Latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"Caramel Latte","tr":"Caramel Latte","ar":"Caramel Latte"}',
  180, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":180},{"size":"Medium","price":200}]'::jsonb
);

-- Merge Vanilla Latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Vanilla Latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Vanilla Latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"Vanilla Latte","tr":"Vanilla Latte","ar":"Vanilla Latte"}',
  160, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":160},{"size":"Medium","price":180}]'::jsonb
);

-- Merge Filter Coffee variants
DELETE FROM items WHERE names->>'en' LIKE 'Filter Coffee%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Filter Coffee';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"Filter Coffee","tr":"Filter Coffee","ar":"Filter Coffee"}',
  140, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":140},{"size":"Medium","price":160}]'::jsonb
);

-- Merge Filter Coffee with Milk variants
DELETE FROM items WHERE names->>'en' LIKE 'Filter Coffee with Milk%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Filter Coffee with Milk';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"Filter Coffee with Milk","tr":"Filter Coffee with Milk","ar":"Filter Coffee with Milk"}',
  160, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":160},{"size":"Medium","price":180}]'::jsonb
);

-- Merge Flat White variants
DELETE FROM items WHERE names->>'en' LIKE 'Flat White%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Flat White';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"Flat White","tr":"Flat White","ar":"Flat White"}',
  140, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":140},{"size":"Medium","price":160}]'::jsonb
);

-- Merge Hot Chocolate variants
DELETE FROM items WHERE names->>'en' LIKE 'Hot Chocolate%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Hot Chocolate';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"Hot Chocolate","tr":"Hot Chocolate","ar":"Hot Chocolate"}',
  200, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":200},{"size":"Medium","price":220}]'::jsonb
);

-- Merge White Hot Chocolate variants
DELETE FROM items WHERE names->>'en' LIKE 'White Hot Chocolate%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'White Hot Chocolate';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"White Hot Chocolate","tr":"White Hot Chocolate","ar":"White Hot Chocolate"}',
  200, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":200},{"size":"Medium","price":220}]'::jsonb
);

-- Merge White Mocha Latte variants
DELETE FROM items WHERE names->>'en' LIKE 'White Mocha Latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'White Mocha Latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"White Mocha Latte","tr":"White Mocha Latte","ar":"White Mocha Latte"}',
  180, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":180},{"size":"Medium","price":200}]'::jsonb
);

-- Merge Salted Caramel Latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Salted Caramel Latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Salted Caramel Latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"Salted Caramel Latte","tr":"Salted Caramel Latte","ar":"Salted Caramel Latte"}',
  180, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":180},{"size":"Medium","price":200}]'::jsonb
);

-- Merge Spanish Latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Spanish Latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Spanish Latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"Spanish Latte","tr":"Spanish Latte","ar":"Spanish Latte"}',
  180, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":180},{"size":"Medium","price":200}]'::jsonb
);

-- Merge Toffee Nut Latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Toffee Nut Latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Toffee Nut Latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"Toffee Nut Latte","tr":"Toffee Nut Latte","ar":"Toffee Nut Latte"}',
  180, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":180},{"size":"Medium","price":220}]'::jsonb
);

-- Merge Zebra Mocha variants
DELETE FROM items WHERE names->>'en' LIKE 'Zebra Mocha%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Zebra Mocha';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"Zebra Mocha","tr":"Zebra Mocha","ar":"Zebra Mocha"}',
  200, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":200},{"size":"Medium","price":220}]'::jsonb
);

-- Merge Piko Mocha variants
DELETE FROM items WHERE names->>'en' LIKE 'Piko Mocha%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Piko Mocha';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"Piko Mocha","tr":"Piko Mocha","ar":"Piko Mocha"}',
  200, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":200},{"size":"Medium","price":220}]'::jsonb
);

-- Merge Cheese cake Latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Cheese cake Latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Cheese cake Latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"Cheese cake Latte","tr":"Cheese cake Latte","ar":"Cheese cake Latte"}',
  200, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":200},{"size":"Medium","price":220}]'::jsonb
);

-- Merge Butter scotch Latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Butter scotch Latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Butter scotch Latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"Butter scotch Latte","tr":"Butter scotch Latte","ar":"Butter scotch Latte"}',
  180, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":180},{"size":"Medium","price":200}]'::jsonb
);

-- Merge Chai Tea Latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Chai Tea Latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Chai Tea Latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"Chai Tea Latte","tr":"Chai Tea Latte","ar":"Chai Tea Latte"}',
  180, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":180},{"size":"Medium","price":200}]'::jsonb
);

-- Merge Strawberry mocha latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Strawberry mocha latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Strawberry mocha latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"Strawberry mocha latte","tr":"Strawberry mocha latte","ar":"Strawberry mocha latte"}',
  180, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":180},{"size":"Medium","price":200}]'::jsonb
);

-- Merge V60 variants
DELETE FROM items WHERE names->>'en' LIKE 'V60%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'V60';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks'),
  '{"en":"V60","tr":"V60","ar":"V60"}',
  195, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Hot drinks')),
  true,
  '[{"size":"Regular","price":195},{"size":"Medium","price":220}]'::jsonb
);

-- Merge Iced Caramel Latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced Caramel Latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced Caramel Latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced Caramel Latte","tr":"Iced Caramel Latte","ar":"Iced Caramel Latte"}',
  180, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":180},{"size":"Medium","price":200},{"size":"Large","price":220}]'::jsonb
);

-- Merge Iced Vanilla Latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced Vanilla Latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced Vanilla Latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced Vanilla Latte","tr":"Iced Vanilla Latte","ar":"Iced Vanilla Latte"}',
  180, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":180},{"size":"Medium","price":200},{"size":"Large","price":220}]'::jsonb
);

-- Merge Iced Filter Coffee variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced Filter Coffee%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced Filter Coffee';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced Filter Coffee","tr":"Iced Filter Coffee","ar":"Iced Filter Coffee"}',
  125, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":125},{"size":"Medium","price":130},{"size":"Large","price":145}]'::jsonb
);

-- Merge Iced Filter Coffee with Milk variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced Filter Coffee with Milk%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced Filter Coffee with Milk';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced Filter Coffee with Milk","tr":"Iced Filter Coffee with Milk","ar":"Iced Filter Coffee with Milk"}',
  140, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":140},{"size":"Medium","price":160},{"size":"Large","price":180}]'::jsonb
);

-- Merge Iced Caramel Latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced Caramel Latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced Caramel Latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced Caramel Latte","tr":"Iced Caramel Latte","ar":"Iced Caramel Latte"}',
  180, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":180},{"size":"Medium","price":200},{"size":"Large","price":220}]'::jsonb
);

-- Merge Iced caramel macchiato variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced caramel macchiato%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced caramel macchiato';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced caramel macchiato","tr":"Iced caramel macchiato","ar":"Iced caramel macchiato"}',
  180, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":180},{"size":"Medium","price":200},{"size":"Large","price":220}]'::jsonb
);

-- Merge Iced chai tea latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced chai tea latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced chai tea latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced chai tea latte","tr":"Iced chai tea latte","ar":"Iced chai tea latte"}',
  200, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":200},{"size":"Large","price":240}]'::jsonb
);

-- Merge Iced Matcha latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced Matcha latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced Matcha latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced Matcha latte","tr":"Iced Matcha latte","ar":"Iced Matcha latte"}',
  190, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":190},{"size":"Medium","price":220},{"size":"Large","price":250}]'::jsonb
);

-- Merge Iced Pink matcha latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced Pink matcha latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced Pink matcha latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced Pink matcha latte","tr":"Iced Pink matcha latte","ar":"Iced Pink matcha latte"}',
  190, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":190},{"size":"Medium","price":220},{"size":"Large","price":250}]'::jsonb
);

-- Merge Iced Pink Perry matcha latta variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced Pink Perry matcha latta%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced Pink Perry matcha latta';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced Pink Perry matcha latta","tr":"Iced Pink Perry matcha latta","ar":"Iced Pink Perry matcha latta"}',
  190, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":190},{"size":"Medium","price":220},{"size":"Large","price":250}]'::jsonb
);

-- Merge Iced Spanish Latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced Spanish Latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced Spanish Latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced Spanish Latte","tr":"Iced Spanish Latte","ar":"Iced Spanish Latte"}',
  180, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":180},{"size":"Medium","price":200},{"size":"Large","price":220}]'::jsonb
);

-- Merge Iced Strawberry matcha latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced Strawberry matcha latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced Strawberry matcha latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced Strawberry matcha latte","tr":"Iced Strawberry matcha latte","ar":"Iced Strawberry matcha latte"}',
  190, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":190},{"size":"Medium","price":220},{"size":"Large","price":250}]'::jsonb
);

-- Merge Iced strawberry mocha variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced strawberry mocha%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced strawberry mocha';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced strawberry mocha","tr":"Iced strawberry mocha","ar":"Iced strawberry mocha"}',
  200, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":200},{"size":"Medium","price":220},{"size":"Large","price":240}]'::jsonb
);

-- Merge Iced Salted Caramel Latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced Salted Caramel Latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced Salted Caramel Latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced Salted Caramel Latte","tr":"Iced Salted Caramel Latte","ar":"Iced Salted Caramel Latte"}',
  180, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":180},{"size":"Medium","price":200},{"size":"Large","price":220}]'::jsonb
);

-- Merge Iced Toffee Nut Latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced Toffee Nut Latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced Toffee Nut Latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced Toffee Nut Latte","tr":"Iced Toffee Nut Latte","ar":"Iced Toffee Nut Latte"}',
  180, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":180},{"size":"Medium","price":220},{"size":"Large","price":240}]'::jsonb
);

-- Merge Iced Zebra mocha latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced Zebra mocha latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced Zebra mocha latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced Zebra mocha latte","tr":"Iced Zebra mocha latte","ar":"Iced Zebra mocha latte"}',
  200, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":200},{"size":"Medium","price":220},{"size":"Large","price":240}]'::jsonb
);

-- Merge Iced White Chocolate Mocha variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced White Chocolate Mocha%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced White Chocolate Mocha';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced White Chocolate Mocha","tr":"Iced White Chocolate Mocha","ar":"Iced White Chocolate Mocha"}',
  200, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":200},{"size":"Medium","price":220},{"size":"Large","price":240}]'::jsonb
);

-- Merge Cherry Blossom Iced Latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Cherry Blossom Iced Latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Cherry Blossom Iced Latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Cherry Blossom Iced Latte","tr":"Cherry Blossom Iced Latte","ar":"Cherry Blossom Iced Latte"}',
  180, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":180},{"size":"Medium","price":220},{"size":"Large","price":240}]'::jsonb
);

-- Merge Caramel bubbles Iced Latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Caramel bubbles Iced Latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Caramel bubbles Iced Latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Caramel bubbles Iced Latte","tr":"Caramel bubbles Iced Latte","ar":"Caramel bubbles Iced Latte"}',
  180, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":180},{"size":"Medium","price":200},{"size":"Large","price":220}]'::jsonb
);

-- Merge Coconut Iced Latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Coconut Iced Latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Coconut Iced Latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Coconut Iced Latte","tr":"Coconut Iced Latte","ar":"Coconut Iced Latte"}',
  180, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":180},{"size":"Medium","price":200},{"size":"Large","price":220}]'::jsonb
);

-- Merge Iced butter scotch variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced butter scotch%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced butter scotch';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced butter scotch","tr":"Iced butter scotch","ar":"Iced butter scotch"}',
  180, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":180},{"size":"Medium","price":200},{"size":"Large","price":220}]'::jsonb
);

-- Merge Iced piko latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced piko latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced piko latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced piko latte","tr":"Iced piko latte","ar":"Iced piko latte"}',
  200, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":200},{"size":"Medium","price":220},{"size":"Large","price":240}]'::jsonb
);

-- Merge Iced cheese cake latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced cheese cake latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced cheese cake latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced cheese cake latte","tr":"Iced cheese cake latte","ar":"Iced cheese cake latte"}',
  200, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":200},{"size":"Medium","price":220},{"size":"Large","price":250}]'::jsonb
);

-- Merge Iced Pink Perry matcha latta variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced Pink Perry matcha latta%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced Pink Perry matcha latta';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced Pink Perry matcha latta","tr":"Iced Pink Perry matcha latta","ar":"Iced Pink Perry matcha latta"}',
  190, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":190},{"size":"Medium","price":220},{"size":"Large","price":250}]'::jsonb
);

-- Merge Iced Pink matcha latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced Pink matcha latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced Pink matcha latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced Pink matcha latte","tr":"Iced Pink matcha latte","ar":"Iced Pink matcha latte"}',
  190, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":190},{"size":"Medium","price":220},{"size":"Large","price":250}]'::jsonb
);

-- Merge Iced Matcha latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced Matcha latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced Matcha latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced Matcha latte","tr":"Iced Matcha latte","ar":"Iced Matcha latte"}',
  190, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":190},{"size":"Medium","price":220},{"size":"Large","price":250}]'::jsonb
);

-- Merge Iced Mocha Latte variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced Mocha Latte%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced Mocha Latte';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced Mocha Latte","tr":"Iced Mocha Latte","ar":"Iced Mocha Latte"}',
  200, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":200},{"size":"Medium","price":220},{"size":"Large","price":240}]'::jsonb
);

-- Merge Iced White Chocolate Mocha variants
DELETE FROM items WHERE names->>'en' LIKE 'Iced White Chocolate Mocha%' AND (names->>'en' LIKE '%Medium%' OR names->>'en' LIKE '%Large%' OR names->>'en' LIKE '%Regular%');
DELETE FROM items WHERE names->>'en' = 'Iced White Chocolate Mocha';

INSERT INTO items (category_id, names, price, image_url, sort_order, is_active, variants) VALUES (
  (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks'),
  '{"en":"Iced White Chocolate Mocha","tr":"Iced White Chocolate Mocha","ar":"Iced White Chocolate Mocha"}',
  200, -- Base price (smallest size)
  NULL,
  (SELECT MAX(sort_order) + 1 FROM items WHERE category_id = (SELECT id FROM categories WHERE names->>'en' = 'Cold drinks')),
  true,
  '[{"size":"Regular","price":200},{"size":"Medium","price":220},{"size":"Large","price":240}]'::jsonb
);

