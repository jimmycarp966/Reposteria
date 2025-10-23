-- Crear función para completar pedido y crear venta automáticamente
CREATE OR REPLACE FUNCTION complete_order_and_create_sale(
  order_id_param UUID,
  payment_status_param VARCHAR(20) DEFAULT 'pendiente'
)
RETURNS JSON AS $$
DECLARE
  order_record RECORD;
  sale_id UUID;
  sale_total DECIMAL(10, 2);
  result JSON;
BEGIN
  -- Verificar que el pedido existe y está en estado válido
  SELECT * INTO order_record
  FROM orders 
  WHERE id = order_id_param 
    AND status IN ('CONFIRMED', 'IN_PRODUCTION')
    AND status != 'COMPLETED';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Pedido no encontrado o no se puede completar'
    );
  END IF;
  
  -- Calcular total de la venta
  sale_total := order_record.total_price;
  
  -- Crear venta
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
    CURRENT_DATE,
    NULL, -- customer_id será null por ahora
    sale_total,
    'efectivo',
    payment_status_param,
    CASE WHEN payment_status_param = 'pagado' THEN sale_total ELSE 0 END,
    CASE WHEN payment_status_param = 'pagado' THEN 0 ELSE sale_total END,
    'Venta generada automáticamente desde pedido completado'
  ) RETURNING id INTO sale_id;
  
  -- Crear sale_items copiando order_items
  INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
  SELECT 
    sale_id,
    oi.product_id,
    oi.quantity,
    oi.unit_price,
    oi.quantity * oi.unit_price
  FROM order_items oi
  WHERE oi.order_id = order_id_param;
  
  -- Actualizar estado del pedido a COMPLETED
  UPDATE orders 
  SET status = 'COMPLETED'
  WHERE id = order_id_param;
  
  -- Retornar éxito
  RETURN json_build_object(
    'success', true,
    'message', 'Pedido completado y venta creada exitosamente',
    'sale_id', sale_id,
    'total_amount', sale_total
  );
  
EXCEPTION WHEN OTHERS THEN
  -- En caso de error, hacer rollback automático
  RETURN json_build_object(
    'success', false,
    'message', 'Error al completar pedido: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql;
