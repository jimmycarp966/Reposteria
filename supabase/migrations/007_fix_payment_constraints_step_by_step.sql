-- Migration: Fix payment constraints step by step
-- Date: 2024-12-19
-- Description: Add payment fields and constraints without errors

-- Step 1: Create ENUM for payment status (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
    CREATE TYPE payment_status_enum AS ENUM ('pendiente', 'parcial', 'pagado');
  END IF;
END $$;

-- Step 2: Add payment fields to orders table (if not exists)
DO $$
BEGIN
  -- Add payment_status column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
    ALTER TABLE orders ADD COLUMN payment_status payment_status_enum DEFAULT 'pendiente';
  END IF;
  
  -- Add amount_paid column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'amount_paid') THEN
    ALTER TABLE orders ADD COLUMN amount_paid DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  -- Add amount_pending column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'amount_pending') THEN
    ALTER TABLE orders ADD COLUMN amount_pending DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

-- Step 3: Add payment fields to sales table (if not exists)
DO $$
BEGIN
  -- Add payment_status column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'sales' AND column_name = 'payment_status') THEN
    ALTER TABLE sales ADD COLUMN payment_status payment_status_enum DEFAULT 'pendiente';
  END IF;
  
  -- Add amount_paid column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'sales' AND column_name = 'amount_paid') THEN
    ALTER TABLE sales ADD COLUMN amount_paid DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  -- Add amount_pending column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'sales' AND column_name = 'amount_pending') THEN
    ALTER TABLE sales ADD COLUMN amount_pending DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

-- Step 4: Initialize existing records with correct payment amounts
UPDATE orders 
SET 
  amount_pending = total_price,
  amount_paid = 0,
  payment_status = 'pendiente'
WHERE payment_status IS NULL OR amount_paid IS NULL OR amount_pending IS NULL;

UPDATE sales 
SET 
  amount_pending = total_amount,
  amount_paid = 0,
  payment_status = 'pendiente'
WHERE payment_status IS NULL OR amount_paid IS NULL OR amount_pending IS NULL;

-- Step 5: Fix any existing inconsistencies
UPDATE orders 
SET amount_pending = total_price - COALESCE(amount_paid, 0)
WHERE amount_paid + amount_pending != total_price;

UPDATE sales 
SET amount_pending = total_amount - COALESCE(amount_paid, 0)
WHERE amount_paid + amount_pending != total_amount;

-- Step 6: Update payment_status based on corrected amounts
UPDATE orders 
SET payment_status = CASE 
  WHEN amount_paid = 0 THEN 'pendiente'
  WHEN amount_paid >= total_price THEN 'pagado'
  ELSE 'parcial'
END;

UPDATE sales 
SET payment_status = CASE 
  WHEN amount_paid = 0 THEN 'pendiente'
  WHEN amount_paid >= total_amount THEN 'pagado'
  ELSE 'parcial'
END;

-- Step 7: Add NOT NULL constraints
ALTER TABLE orders 
ALTER COLUMN payment_status SET NOT NULL,
ALTER COLUMN amount_paid SET NOT NULL,
ALTER COLUMN amount_pending SET NOT NULL;

ALTER TABLE sales 
ALTER COLUMN payment_status SET NOT NULL,
ALTER COLUMN amount_paid SET NOT NULL,
ALTER COLUMN amount_pending SET NOT NULL;

-- Step 8: Add CHECK constraints (only after data is correct)
ALTER TABLE orders 
ADD CONSTRAINT check_order_payment_amounts 
CHECK (amount_paid + amount_pending = total_price);

ALTER TABLE sales 
ADD CONSTRAINT check_sale_payment_amounts 
CHECK (amount_paid + amount_pending = total_amount);

-- Step 9: Add CHECK constraints for non-negative amounts
ALTER TABLE orders 
ADD CONSTRAINT check_order_amounts_positive 
CHECK (amount_paid >= 0 AND amount_pending >= 0);

ALTER TABLE sales 
ADD CONSTRAINT check_sale_amounts_positive 
CHECK (amount_paid >= 0 AND amount_pending >= 0);

-- Step 10: Create function to register payments atomically
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

-- Step 11: Create function to get accounts receivable
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

-- Step 12: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_pending_amount ON orders(amount_pending) WHERE payment_status IN ('pendiente', 'parcial');
CREATE INDEX IF NOT EXISTS idx_sales_pending_amount ON sales(amount_pending) WHERE payment_status IN ('pendiente', 'parcial');


