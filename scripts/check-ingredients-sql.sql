-- Script SQL para verificar ingredientes en Supabase
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Contar total de ingredientes
SELECT 
  COUNT(*) as total_ingredientes
FROM ingredients;

-- 2. Listar TODOS los ingredientes (sin paginación)
SELECT 
  id,
  name,
  unit,
  cost_per_unit,
  supplier,
  created_at,
  image_url
FROM ingredients
ORDER BY created_at DESC;

-- 3. Verificar ingredientes con y sin registro de inventory
SELECT 
  i.id,
  i.name,
  i.unit,
  CASE 
    WHEN inv.id IS NOT NULL THEN 'Tiene inventory'
    ELSE 'SIN inventory'
  END as estado_inventory,
  COALESCE(inv.quantity, 0) as cantidad_inventory,
  COALESCE(inv.unit, i.unit) as unidad_inventory
FROM ingredients i
LEFT JOIN inventory inv ON i.id = inv.ingredient_id
ORDER BY i.created_at DESC;

-- 4. Contar ingredientes sin registro de inventory
SELECT 
  COUNT(*) as ingredientes_sin_inventory
FROM ingredients i
LEFT JOIN inventory inv ON i.id = inv.ingredient_id
WHERE inv.id IS NULL;

-- 5. Verificar los últimos ingredientes creados (últimos 10)
SELECT 
  i.id,
  i.name,
  i.unit,
  i.cost_per_unit,
  i.created_at,
  inv.id as inventory_id,
  inv.quantity as inventory_quantity
FROM ingredients i
LEFT JOIN inventory inv ON i.id = inv.ingredient_id
ORDER BY i.created_at DESC
LIMIT 10;

-- 6. Verificar si hay ingredientes creados hoy
SELECT 
  COUNT(*) as ingredientes_creados_hoy,
  STRING_AGG(name, ', ') as nombres
FROM ingredients
WHERE DATE(created_at) = CURRENT_DATE;

-- 7. Verificar si la consulta de getIngredients funciona correctamente
-- (simula la consulta que hace la aplicación)
SELECT 
  i.*,
  jsonb_build_object(
    'quantity', inv.quantity,
    'unit', inv.unit,
    'location', inv.location
  ) as inventory
FROM ingredients i
LEFT JOIN inventory inv ON i.id = inv.ingredient_id
ORDER BY i.name
LIMIT 20;

