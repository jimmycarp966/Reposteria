-- Fix payment constraints by correcting existing data first
-- This migration addresses the constraint violation error

-- First, let's check and fix any existing data inconsistencies
-- Remove any existing constraints that might be causing issues
ALTER TABLE orders DROP CONSTRAINT IF EXISTS check_order_payment_amounts;
ALTER TABLE sales DROP CONSTRAINT IF EXISTS check_sale_payment_amounts;

-- Fix any NULL values in payment fields for orders
UPDATE orders 
SET 
  payment_status = 'pendiente',
  amount_paid = 0,
  amount_pending = total_price
WHERE payment_status IS NULL 
   OR amount_paid IS NULL 
   OR amount_pending IS NULL;

-- Fix any NULL values in payment fields for sales
UPDATE sales 
SET 
  payment_status = 'pendiente',
  amount_paid = 0,
  amount_pending = total_amount
WHERE payment_status IS NULL 
   OR amount_paid IS NULL 
   OR amount_pending IS NULL;

-- Ensure all existing records have correct payment amounts
-- For orders: set amount_pending = total_price - amount_paid
UPDATE orders 
SET amount_pending = total_price - COALESCE(amount_paid, 0)
WHERE amount_paid + amount_pending != total_price;

-- For sales: set amount_pending = total_amount - amount_paid  
UPDATE sales 
SET amount_pending = total_amount - COALESCE(amount_paid, 0)
WHERE amount_paid + amount_pending != total_amount;

-- Update payment_status based on amounts
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

-- Now add the constraints back
ALTER TABLE orders 
ADD CONSTRAINT check_order_payment_amounts 
CHECK (amount_paid + amount_pending = total_price);

ALTER TABLE sales 
ADD CONSTRAINT check_sale_payment_amounts 
CHECK (amount_paid + amount_pending = total_amount);

-- Add NOT NULL constraints to ensure data integrity
ALTER TABLE orders 
ALTER COLUMN payment_status SET NOT NULL,
ALTER COLUMN amount_paid SET NOT NULL,
ALTER COLUMN amount_pending SET NOT NULL;

ALTER TABLE sales 
ALTER COLUMN payment_status SET NOT NULL,
ALTER COLUMN amount_paid SET NOT NULL,
ALTER COLUMN amount_pending SET NOT NULL;


