-- Actualizar la función confirm_order_and_update_stock para permitir confirmación forzada
CREATE OR REPLACE FUNCTION confirm_order_and_update_stock(
  order_id_param UUID,
  force_confirm_param BOOLEAN DEFAULT FALSE
) RETURNS JSONB AS $$
DECLARE
  shortages_found JSONB[];
  has_shortages BOOLEAN := FALSE;
BEGIN
  -- Verificar stock
  WITH required_ingredients AS (
    SELECT 
      i.id AS ingredient_id,
      i.name AS ingredient_name,
      SUM(ri.quantity * oi.quantity) AS required_quantity,
      inv.quantity AS available_quantity
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    JOIN recipes r ON p.recipe_id = r.id
    JOIN recipe_ingredients ri ON r.id = ri.recipe_id
    JOIN ingredients i ON ri.ingredient_id = i.id
    JOIN inventory inv ON i.id = inv.ingredient_id
    WHERE o.id = order_id_param
    GROUP BY i.id, i.name, inv.quantity
  )
  SELECT array_agg(
    jsonb_build_object(
      'ingredient_id', ingredient_id,
      'ingredient_name', ingredient_name,
      'required_quantity', required_quantity,
      'available_quantity', available_quantity,
      'shortage', required_quantity - available_quantity
    )
  )
  INTO shortages_found
  FROM required_ingredients
  WHERE required_quantity > available_quantity;

  -- Si hay faltantes y no estamos forzando la confirmación
  IF shortages_found IS NOT NULL AND NOT force_confirm_param THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'Stock insuficiente',
      'shortages', shortages_found
    );
  END IF;

  -- Si hay faltantes, marcar que el pedido tiene faltantes
  has_shortages := shortages_found IS NOT NULL;

  -- Confirmar pedido
  UPDATE orders 
  SET 
    status = 'CONFIRMED'
  WHERE id = order_id_param;

  -- Si no hay faltantes o estamos forzando la confirmación y hay stock suficiente,
  -- descontar el stock
  IF NOT has_shortages THEN
    -- Insertar movimientos de inventario y actualizar stock
    WITH required_ingredients AS (
      SELECT 
        i.id AS ingredient_id,
        SUM(ri.quantity * oi.quantity) AS total_quantity
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      JOIN recipes r ON p.recipe_id = r.id
      JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE o.id = order_id_param
      GROUP BY i.id
    )
    INSERT INTO inventory_movements (
      ingredient_id,
      quantity,
      type,
      order_id,
      notes
    )
    SELECT 
      ingredient_id,
      -total_quantity,
      'OUT',
      order_id_param,
      'Pedido confirmado'
    FROM required_ingredients;

    -- Actualizar inventario
    UPDATE inventory inv
    SET quantity = inv.quantity - ri.total_quantity
    FROM required_ingredients ri
    WHERE inv.ingredient_id = ri.ingredient_id;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', CASE 
      WHEN has_shortages THEN 'Pedido confirmado con faltantes'
      ELSE 'Pedido confirmado exitosamente'
    END,
    'has_shortages', has_shortages
  );
END;
$$ LANGUAGE plpgsql;
