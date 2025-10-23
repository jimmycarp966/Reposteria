-- Eliminar la restricción de unicidad en recipe_ingredients para permitir ingredientes duplicados
-- Esto permite usar el mismo ingrediente múltiples veces en una receta

-- Eliminar la restricción única existente
ALTER TABLE recipe_ingredients 
DROP CONSTRAINT IF EXISTS recipe_ingredients_recipe_id_ingredient_id_key;

-- Opcional: Agregar un índice para mejorar el rendimiento sin restricción de unicidad
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_ingredient 
ON recipe_ingredients(recipe_id, ingredient_id);

-- Comentario explicativo
COMMENT ON TABLE recipe_ingredients IS 'Permite ingredientes duplicados en la misma receta (ej: harina para masa y harina para relleno)';
