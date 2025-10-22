-- Seeds para datos de ejemplo
-- Este archivo contiene datos iniciales para probar el sistema

-- Insertar ingredientes comunes de repostería
INSERT INTO ingredients (id, name, unit, cost_per_unit, supplier) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Harina 000', 'kg', 350.00, 'Molinos Ala'),
  ('22222222-2222-2222-2222-222222222222', 'Azúcar', 'kg', 280.00, 'Ledesma'),
  ('33333333-3333-3333-3333-333333333333', 'Huevos', 'unidad', 45.00, 'Granja Local'),
  ('44444444-4444-4444-4444-444444444444', 'Manteca', 'kg', 1200.00, 'La Serenísima'),
  ('55555555-5555-5555-5555-555555555555', 'Leche', 'litro', 450.00, 'La Serenísima'),
  ('66666666-6666-6666-6666-666666666666', 'Cacao en polvo', 'kg', 3500.00, 'Mamuschka'),
  ('77777777-7777-7777-7777-777777777777', 'Chocolate cobertura', 'kg', 4200.00, 'Águila'),
  ('88888888-8888-8888-8888-888888888888', 'Esencia de vainilla', 'ml', 15.00, 'Fleischmann'),
  ('99999999-9999-9999-9999-999999999999', 'Polvo de hornear', 'kg', 800.00, 'Royal'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Crema de leche', 'litro', 850.00, 'La Serenísima');

-- Insertar stock inicial en inventario
INSERT INTO inventory (ingredient_id, quantity, unit, location) VALUES
  ('11111111-1111-1111-1111-111111111111', 10.000, 'kg', 'Despensa'),
  ('22222222-2222-2222-2222-222222222222', 8.000, 'kg', 'Despensa'),
  ('33333333-3333-3333-3333-333333333333', 36.000, 'unidad', 'Heladera'),
  ('44444444-4444-4444-4444-444444444444', 2.500, 'kg', 'Heladera'),
  ('55555555-5555-5555-5555-555555555555', 5.000, 'litro', 'Heladera'),
  ('66666666-6666-6666-6666-666666666666', 1.000, 'kg', 'Despensa'),
  ('77777777-7777-7777-7777-777777777777', 1.500, 'kg', 'Despensa'),
  ('88888888-8888-8888-8888-888888888888', 200.000, 'ml', 'Despensa'),
  ('99999999-9999-9999-9999-999999999999', 0.500, 'kg', 'Despensa'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3.000, 'litro', 'Heladera');

-- Insertar receta de Torta de Chocolate
INSERT INTO recipes (id, name, description, servings, version, active) VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Torta de Chocolate Clásica', 'Deliciosa torta de chocolate húmeda con cobertura de ganache', 12, 1, true);

-- Insertar ingredientes de la receta de Torta de Chocolate
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 0.300, 'kg'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 0.250, 'kg'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', 4.000, 'unidad'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '44444444-4444-4444-4444-444444444444', 0.150, 'kg'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '55555555-5555-5555-5555-555555555555', 0.200, 'litro'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '66666666-6666-6666-6666-666666666666', 0.100, 'kg'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '88888888-8888-8888-8888-888888888888', 10.000, 'ml'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '99999999-9999-9999-9999-999999999999', 0.010, 'kg');

-- Insertar receta de Alfajores de Maicena
INSERT INTO recipes (id, name, description, servings, version, active) VALUES
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Alfajores de Maicena', 'Clásicos alfajores argentinos con dulce de leche', 24, 1, true);

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '11111111-1111-1111-1111-111111111111', 0.200, 'kg'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '22222222-2222-2222-2222-222222222222', 0.150, 'kg'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333', 3.000, 'unidad'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '44444444-4444-4444-4444-444444444444', 0.100, 'kg'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '88888888-8888-8888-8888-888888888888', 5.000, 'ml'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '99999999-9999-9999-9999-999999999999', 0.005, 'kg');

-- Calcular costos y crear productos
-- Torta de Chocolate: costo = (300*0.35 + 250*0.28 + 4*45 + 150*1.2 + 200*0.45 + 100*3.5 + 10*0.015 + 10*0.8) / 12
-- = (105 + 70 + 180 + 180 + 90 + 350 + 0.15 + 8) / 12 = 983.15 / 12 = 81.93 por porción
-- Precio sugerido con 60% markup: 81.93 * 1.6 = 131.09

INSERT INTO products (id, recipe_id, name, base_cost_cache, suggested_price_cache, sku) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Torta de Chocolate (12 porciones)', 983.15, 1573.04, 'TRT-CHOC-001');

-- Alfajores: costo = (200*0.35 + 150*0.28 + 3*45 + 100*1.2 + 5*0.015 + 5*0.8) / 24
-- = (70 + 42 + 135 + 120 + 0.075 + 4) / 24 = 371.075 / 24 = 15.46 por alfajor
-- Precio sugerido: 15.46 * 1.6 = 24.74

INSERT INTO products (id, recipe_id, name, base_cost_cache, suggested_price_cache, sku) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Alfajores de Maicena (docena)', 185.54, 296.86, 'ALF-MAIC-001');

-- Insertar efeméride de ejemplo
INSERT INTO events_calendar (id, name, date, description, type) VALUES
  ('550e8400-e29b-41d4-a716-446655440002', 'Día de la Madre', '2025-10-19', 'Promoción especial para el Día de la Madre', 'EFEMERIDE');

-- Insertar regla de precio para Día de la Madre (markup especial del 80%)
INSERT INTO price_rules (id, name, markup_percent, fixed_fee, effective_from, effective_to, event_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440003', 'Promoción Día de la Madre', 80.00, 0.00, '2025-10-01', '2025-10-19', '550e8400-e29b-41d4-a716-446655440002');

-- Insertar pedido de ejemplo (pedido diario para mañana)
INSERT INTO orders (id, type, status, delivery_date, delivery_time, total_cost, total_price, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440004', 'DAILY', 'PENDING', CURRENT_DATE + INTERVAL '1 day', '15:00:00', 983.15, 1573.04, 'Pedido de cumpleaños - Agregar velitas');

-- Insertar items del pedido
INSERT INTO order_items (order_id, product_id, quantity, unit_price, cost_at_sale, production_time_estimate_minutes) VALUES
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 1, 1573.04, 983.15, 180);

-- Insertar tareas de producción para el pedido
INSERT INTO production_tasks (order_item_id, task_name, duration_minutes, status) VALUES
  ((SELECT id FROM order_items WHERE order_id = '550e8400-e29b-41d4-a716-446655440004' LIMIT 1), 'Preparar masa', 30, 'PENDING'),
  ((SELECT id FROM order_items WHERE order_id = '550e8400-e29b-41d4-a716-446655440004' LIMIT 1), 'Hornear', 60, 'PENDING'),
  ((SELECT id FROM order_items WHERE order_id = '550e8400-e29b-41d4-a716-446655440004' LIMIT 1), 'Enfriar', 45, 'PENDING'),
  ((SELECT id FROM order_items WHERE order_id = '550e8400-e29b-41d4-a716-446655440004' LIMIT 1), 'Decorar', 45, 'PENDING');



