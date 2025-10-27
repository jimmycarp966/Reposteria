-- Migración para crear tabla de historial de precios
-- Fecha: 2024-12-25
-- Descripción: Sistema de historial de precios para productos e ingredientes

-- Crear tabla para historial de precios de productos
CREATE TABLE IF NOT EXISTS product_price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2) NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para historial de precios de ingredientes
CREATE TABLE IF NOT EXISTS ingredient_price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2) NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_product_price_history_product_id ON product_price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_price_history_changed_at ON product_price_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingredient_price_history_ingredient_id ON ingredient_price_history(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_price_history_changed_at ON ingredient_price_history(changed_at DESC);

-- Función para registrar cambio de precio de producto
CREATE OR REPLACE FUNCTION log_product_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo registrar si el precio realmente cambió
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO product_price_history (
      product_id,
      old_price,
      new_price,
      changed_by,
      change_reason
    ) VALUES (
      NEW.id,
      OLD.price,
      NEW.price,
      auth.uid(),
      'Precio actualizado'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar cambio de precio de ingrediente
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

-- Crear triggers para capturar cambios automáticamente
DROP TRIGGER IF EXISTS trigger_log_product_price_change ON products;
CREATE TRIGGER trigger_log_product_price_change
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION log_product_price_change();

DROP TRIGGER IF EXISTS trigger_log_ingredient_price_change ON ingredients;
CREATE TRIGGER trigger_log_ingredient_price_change
  AFTER UPDATE ON ingredients
  FOR EACH ROW
  EXECUTE FUNCTION log_ingredient_price_change();

-- Función para obtener historial de precios de un producto
CREATE OR REPLACE FUNCTION get_product_price_history(product_uuid UUID)
RETURNS TABLE (
  id UUID,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2),
  changed_at TIMESTAMP WITH TIME ZONE,
  changed_by UUID,
  change_reason TEXT,
  price_change DECIMAL(10,2),
  price_change_percentage DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pph.id,
    pph.old_price,
    pph.new_price,
    pph.changed_at,
    pph.changed_by,
    pph.change_reason,
    (pph.new_price - COALESCE(pph.old_price, 0)) as price_change,
    CASE 
      WHEN pph.old_price > 0 THEN 
        ROUND(((pph.new_price - pph.old_price) / pph.old_price) * 100, 2)
      ELSE 0
    END as price_change_percentage
  FROM product_price_history pph
  WHERE pph.product_id = product_uuid
  ORDER BY pph.changed_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener historial de precios de un ingrediente
CREATE OR REPLACE FUNCTION get_ingredient_price_history(ingredient_uuid UUID)
RETURNS TABLE (
  id UUID,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2),
  changed_at TIMESTAMP WITH TIME ZONE,
  changed_by UUID,
  change_reason TEXT,
  price_change DECIMAL(10,2),
  price_change_percentage DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    iph.id,
    iph.old_price,
    iph.new_price,
    iph.changed_at,
    iph.changed_by,
    iph.change_reason,
    (iph.new_price - COALESCE(iph.old_price, 0)) as price_change,
    CASE 
      WHEN iph.old_price > 0 THEN 
        ROUND(((iph.new_price - iph.old_price) / iph.old_price) * 100, 2)
      ELSE 0
    END as price_change_percentage
  FROM ingredient_price_history iph
  WHERE iph.ingredient_id = ingredient_uuid
  ORDER BY iph.changed_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Habilitar RLS (Row Level Security)
ALTER TABLE product_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_price_history ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para product_price_history
CREATE POLICY "Users can view product price history" ON product_price_history
  FOR SELECT USING (true);

CREATE POLICY "Users can insert product price history" ON product_price_history
  FOR INSERT WITH CHECK (true);

-- Políticas de seguridad para ingredient_price_history
CREATE POLICY "Users can view ingredient price history" ON ingredient_price_history
  FOR SELECT USING (true);

CREATE POLICY "Users can insert ingredient price history" ON ingredient_price_history
  FOR INSERT WITH CHECK (true);

-- Comentarios para documentación
COMMENT ON TABLE product_price_history IS 'Historial de cambios de precios de productos';
COMMENT ON TABLE ingredient_price_history IS 'Historial de cambios de precios de ingredientes';
COMMENT ON FUNCTION log_product_price_change() IS 'Función trigger para registrar cambios de precio de productos';
COMMENT ON FUNCTION log_ingredient_price_change() IS 'Función trigger para registrar cambios de precio de ingredientes';
COMMENT ON FUNCTION get_product_price_history(UUID) IS 'Función para obtener historial de precios de un producto';
COMMENT ON FUNCTION get_ingredient_price_history(UUID) IS 'Función para obtener historial de precios de un ingrediente';
