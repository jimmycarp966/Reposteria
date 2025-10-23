-- Migration: Add payment status to orders and sales tables
-- Date: 2024-12-19
-- Description: Add payment tracking fields to orders and sales tables

-- Create ENUM for payment status
CREATE TYPE payment_status_enum AS ENUM ('pendiente', 'parcial', 'pagado');

-- Add payment fields to orders table
ALTER TABLE orders 
ADD COLUMN payment_status payment_status_enum NOT NULL DEFAULT 'pendiente',
ADD COLUMN amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
ADD COLUMN amount_pending DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (amount_pending >= 0);

-- Add payment fields to sales table
ALTER TABLE sales 
ADD COLUMN payment_status payment_status_enum NOT NULL DEFAULT 'pendiente',
ADD COLUMN amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
ADD COLUMN amount_pending DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (amount_pending >= 0);

-- Add constraint to ensure amount_paid + amount_pending = total_amount for orders
ALTER TABLE orders 
ADD CONSTRAINT check_order_payment_amounts 
CHECK (amount_paid + amount_pending = total_price);

-- Add constraint to ensure amount_paid + amount_pending = total_amount for sales
ALTER TABLE sales 
ADD CONSTRAINT check_sale_payment_amounts 
CHECK (amount_paid + amount_pending = total_amount);

-- Initialize existing records with correct payment amounts
UPDATE orders 
SET 
  amount_pending = total_price,
  amount_paid = 0,
  payment_status = 'pendiente'
WHERE payment_status IS NULL;

UPDATE sales 
SET 
  amount_pending = total_amount,
  amount_paid = 0,
  payment_status = 'pendiente'
WHERE payment_status IS NULL;

-- Create function to register payments atomically
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
  -- Validate input
  IF payment_amount_param <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'El monto del pago debe ser mayor a 0'
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

  -- Calculate new amounts
  new_paid := current_paid + payment_amount_param;
  new_pending := current_total - new_paid;

  -- Check if payment exceeds total
  IF new_paid > current_total THEN
    RETURN json_build_object(
      'success', false,
      'message', 'El pago excede el monto total. Máximo permitido: ' || (current_total - current_paid)
    );
  END IF;

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
$$ LANGUAGE plpgsql;

-- Create function to get accounts receivable
CREATE OR REPLACE FUNCTION get_accounts_receivable()
RETURNS TABLE(
  id UUID,
  type TEXT,
  customer_name TEXT,
  total_amount DECIMAL(10,2),
  amount_paid DECIMAL(10,2),
  amount_pending DECIMAL(10,2),
  payment_status payment_status_enum,
  created_date DATE,
  due_date DATE
) AS $$
BEGIN
  RETURN QUERY
  -- Orders with pending payments
  SELECT 
    o.id,
    'pedido'::TEXT as type,
    COALESCE(c.name, 'Sin cliente')::TEXT as customer_name,
    o.total_price as total_amount,
    o.amount_paid,
    o.amount_pending,
    o.payment_status,
    o.created_at::DATE as created_date,
    o.delivery_date as due_date
  FROM orders o
  LEFT JOIN customers c ON o.customer_id = c.id
  WHERE o.payment_status IN ('pendiente', 'parcial')
    AND o.status != 'CANCELLED'
  
  UNION ALL
  
  -- Sales with pending payments
  SELECT 
    s.id,
    'venta'::TEXT as type,
    COALESCE(c.name, 'Sin cliente')::TEXT as customer_name,
    s.total_amount,
    s.amount_paid,
    s.amount_pending,
    s.payment_status,
    s.created_at::DATE as created_date,
    s.sale_date as due_date
  FROM sales s
  LEFT JOIN customers c ON s.customer_id = c.id
  WHERE s.payment_status IN ('pendiente', 'parcial')
  
  ORDER BY due_date ASC, created_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Update create_sale_with_items function to include payment fields
CREATE OR REPLACE FUNCTION create_sale_with_items(
  sale_date_param DATE,
  sale_items_param JSONB,
  customer_id_param UUID DEFAULT NULL,
  payment_method_param VARCHAR(20) DEFAULT 'efectivo',
  notes_param TEXT DEFAULT NULL
)
RETURNS JSON
SET search_path = ''
AS $$
DECLARE
  new_sale_id UUID;
  sale_total DECIMAL(10, 2) := 0;
  item_data JSONB;
  item_record RECORD;
BEGIN
  -- Start transaction
  BEGIN
    -- Calculate total from items
    FOR item_data IN SELECT jsonb_array_elements(sale_items_param)
    LOOP
      sale_total := sale_total + (item_data->>'quantity')::INTEGER * (item_data->>'unit_price')::DECIMAL;
    END LOOP;
    
    -- Create sale record with payment fields
    INSERT INTO public.sales (sale_date, customer_id, total_amount, payment_method, payment_status, amount_paid, amount_pending, notes)
    VALUES (sale_date_param, customer_id_param, sale_total, payment_method_param, 'pendiente', 0, sale_total, notes_param)
    RETURNING id INTO new_sale_id;
    
    -- Create sale items
    FOR item_data IN SELECT jsonb_array_elements(sale_items_param)
    LOOP
      INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, subtotal)
      VALUES (
        new_sale_id,
        (item_data->>'product_id')::UUID,
        (item_data->>'quantity')::INTEGER,
        (item_data->>'unit_price')::DECIMAL,
        (item_data->>'quantity')::INTEGER * (item_data->>'unit_price')::DECIMAL
      );
    END LOOP;
    
    -- Return success with sale ID
    RETURN json_build_object(
      'success', true,
      'sale_id', new_sale_id,
      'total_amount', sale_total,
      'message', 'Venta creada exitosamente'
    );
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Return error
      RETURN json_build_object(
        'success', false,
        'message', 'Error al crear venta: ' || SQLERRM
      );
  END;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_pending_amount ON orders(amount_pending) WHERE payment_status IN ('pendiente', 'parcial');
CREATE INDEX IF NOT EXISTS idx_sales_pending_amount ON sales(amount_pending) WHERE payment_status IN ('pendiente', 'parcial');
