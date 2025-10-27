-- Corrección del trigger de historial de precios de ingredientes
-- Ejecutar este SQL directamente en Supabase SQL Editor

-- Función corregida para registrar cambio de precio de ingrediente
CREATE OR REPLACE FUNCTION log_ingredient_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo registrar si el precio realmente cambió
  IF OLD.cost_per_unit IS DISTINCT FROM NEW.cost_per_unit THEN
    INSERT INTO ingredient_price_history (
      ingredient_id,
      old_price,
      new_price,
      changed_by,
      change_reason
    ) VALUES (
      NEW.id,
      OLD.cost_per_unit,
      NEW.cost_per_unit,
      auth.uid(),
      'Precio por unidad actualizado'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verificar que la función se creó correctamente
SELECT proname, prokind, prolang
FROM pg_proc
WHERE proname = 'log_ingredient_price_change';
