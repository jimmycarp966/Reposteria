-- Función para crear venta con items de forma atómica
CREATE OR REPLACE FUNCTION create_sale_with_items(
  sale_date_param DATE,
  sale_items_param JSONB,
  customer_id_param UUID DEFAULT NULL,
  payment_method_param VARCHAR(20) DEFAULT 'efectivo',
  notes_param TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  new_sale_id UUID;
  total_amount DECIMAL(10,2) := 0;
  item_data JSONB;
  item_total DECIMAL(10,2);
BEGIN
  -- Calcular el total de la venta
  FOR item_data IN SELECT * FROM jsonb_array_elements(sale_items_param)
  LOOP
    item_total := (item_data->>'quantity')::DECIMAL * (item_data->>'unit_price')::DECIMAL;
    total_amount := total_amount + item_total;
  END LOOP;

  -- Crear la venta
  INSERT INTO sales (
    sale_date,
    customer_id,
    total_amount,
    payment_method,
    payment_status,
    amount_paid,
    amount_pending,
    notes
  ) VALUES (
    sale_date_param,
    customer_id_param,
    total_amount,
    payment_method_param,
    'pagado', -- Por defecto marcamos como pagado
    total_amount, -- Pagado completo
    0, -- Sin pendiente
    notes_param
  ) RETURNING id INTO new_sale_id;

  -- Crear los items de la venta
  FOR item_data IN SELECT * FROM jsonb_array_elements(sale_items_param)
  LOOP
    INSERT INTO sale_items (
      sale_id,
      product_id,
      quantity,
      unit_price,
      subtotal
    ) VALUES (
      new_sale_id,
      (item_data->>'product_id')::UUID,
      (item_data->>'quantity')::INTEGER,
      (item_data->>'unit_price')::DECIMAL,
      (item_data->>'quantity')::DECIMAL * (item_data->>'unit_price')::DECIMAL
    );
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'message', 'Venta creada exitosamente',
    'sale_id', new_sale_id,
    'total_amount', total_amount
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'message', 'Error al crear venta: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql;
