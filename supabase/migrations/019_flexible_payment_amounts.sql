-- Migration: Allow flexible payment amounts
-- Description: Remove restrictions on payment amounts to allow negative values and amounts exceeding total

-- Update the register_payment function to allow flexible amounts
CREATE OR REPLACE FUNCTION register_payment(
  table_name_param TEXT,
  record_id_param UUID,
  payment_amount_param DECIMAL(10,2)
) RETURNS JSON AS $$
DECLARE
  current_paid DECIMAL(10,2);
  current_pending DECIMAL(10,2);
  current_total DECIMAL(10,2);
  new_paid DECIMAL(10,2);
  new_pending DECIMAL(10,2);
  new_status payment_status_enum;
  result JSON;
BEGIN
  -- Validate input - only check if it's a valid number
  IF payment_amount_param IS NULL OR payment_amount_param::text !~ '^-?[0-9]+(\.[0-9]+)?$' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'El monto del pago debe ser un número válido'
    );
  END IF;

  -- Get current amounts based on table name
  IF table_name_param = 'orders' THEN
    SELECT amount_paid, amount_pending, total_price
    INTO current_paid, current_pending, current_total
    FROM orders WHERE id = record_id_param;
  ELSIF table_name_param = 'sales' THEN
    SELECT amount_paid, amount_pending, total_amount
    INTO current_paid, current_pending, current_total
    FROM sales WHERE id = record_id_param;
  ELSE
    RETURN json_build_object(
      'success', false,
      'message', 'Tabla inválida. Use "orders" o "sales"'
    );
  END IF;

  -- Check if record exists
  IF current_total IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Registro no encontrado'
    );
  END IF;

  -- Calculate new amounts (allow flexible calculations)
  new_paid := GREATEST(0, current_paid + payment_amount_param); -- Ensure paid doesn't go negative
  new_pending := GREATEST(0, current_total - new_paid); -- Ensure pending doesn't go negative

  -- Determine new status
  IF new_pending = 0 THEN
    new_status := 'pagado';
  ELSIF new_paid = 0 THEN
    new_status := 'pendiente';
  ELSE
    new_status := 'parcial';
  END IF;

  -- Update the record
  IF table_name_param = 'orders' THEN
    UPDATE orders
    SET
      amount_paid = new_paid,
      amount_pending = new_pending,
      payment_status = new_status
    WHERE id = record_id_param;
  ELSIF table_name_param = 'sales' THEN
    UPDATE sales
    SET
      amount_paid = new_paid,
      amount_pending = new_pending,
      payment_status = new_status
    WHERE id = record_id_param;
  END IF;

  -- Return success result
  RETURN json_build_object(
    'success', true,
    'message', 'Pago registrado exitosamente',
    'data', json_build_object(
      'amount_paid', new_paid,
      'amount_pending', new_pending,
      'payment_status', new_status
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Error al registrar pago: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
