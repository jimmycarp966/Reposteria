-- Migration: Fix Function Security
-- Adds SET search_path = '' to all functions to prevent security vulnerabilities

-- Fix calculate_recipe_cost function
CREATE OR REPLACE FUNCTION calculate_recipe_cost(recipe_id_param UUID)
RETURNS DECIMAL(10, 2) 
SET search_path = ''
AS $$
DECLARE
  total_cost DECIMAL(10, 2);
  recipe_servings INTEGER;
BEGIN
  -- Get recipe servings
  SELECT servings INTO recipe_servings FROM public.recipes WHERE id = recipe_id_param;
  
  -- Calculate total cost
  SELECT COALESCE(SUM(ri.quantity * i.cost_per_unit), 0)
  INTO total_cost
  FROM public.recipe_ingredients ri
  JOIN public.ingredients i ON ri.ingredient_id = i.id
  WHERE ri.recipe_id = recipe_id_param;
  
  -- Return cost per serving
  IF recipe_servings > 0 THEN
    RETURN total_cost / recipe_servings;
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Fix check_stock_availability function
CREATE OR REPLACE FUNCTION check_stock_availability(order_id_param UUID)
RETURNS TABLE(ingredient_id UUID, ingredient_name VARCHAR, required_quantity DECIMAL, available_quantity DECIMAL, shortage DECIMAL)
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.name,
    SUM(ri.quantity * oi.quantity) as required_qty,
    COALESCE(inv.quantity, 0) as available_qty,
    GREATEST(SUM(ri.quantity * oi.quantity) - COALESCE(inv.quantity, 0), 0) as shortage
  FROM public.order_items oi
  JOIN public.products p ON oi.product_id = p.id
  JOIN public.recipe_ingredients ri ON ri.recipe_id = p.recipe_id
  JOIN public.ingredients i ON ri.ingredient_id = i.id
  LEFT JOIN public.inventory inv ON inv.ingredient_id = i.id
  WHERE oi.order_id = order_id_param
  GROUP BY i.id, i.name, inv.quantity
  HAVING SUM(ri.quantity * oi.quantity) > COALESCE(inv.quantity, 0);
END;
$$ LANGUAGE plpgsql;

-- Fix confirm_order_and_update_stock function
CREATE OR REPLACE FUNCTION confirm_order_and_update_stock(order_id_param UUID)
RETURNS JSON
SET search_path = ''
AS $$
DECLARE
  shortage_count INTEGER;
  result JSON;
BEGIN
  -- Check if there are any stock shortages
  SELECT COUNT(*) INTO shortage_count
  FROM public.check_stock_availability(order_id_param);
  
  IF shortage_count > 0 THEN
    -- Return error with shortage details
    SELECT json_build_object(
      'success', false,
      'message', 'Stock insuficiente',
      'shortages', json_agg(shortage_data)
    ) INTO result
    FROM public.check_stock_availability(order_id_param) as shortage_data;
    
    RETURN result;
  END IF;
  
  -- Update order status
  UPDATE public.orders SET status = 'CONFIRMED' WHERE id = order_id_param;
  
  -- Deduct stock for each ingredient
  INSERT INTO public.inventory_movements (ingredient_id, quantity, type, order_id, notes)
  SELECT 
    i.id,
    -SUM(ri.quantity * oi.quantity),
    'OUT',
    order_id_param,
    'Stock deducted for order confirmation'
  FROM public.order_items oi
  JOIN public.products p ON oi.product_id = p.id
  JOIN public.recipe_ingredients ri ON ri.recipe_id = p.recipe_id
  JOIN public.ingredients i ON ri.ingredient_id = i.id
  WHERE oi.order_id = order_id_param
  GROUP BY i.id;
  
  -- Update inventory quantities
  UPDATE public.inventory inv
  SET 
    quantity = inv.quantity - subq.total_qty,
    last_updated = NOW()
  FROM (
    SELECT 
      i.id as ingredient_id,
      SUM(ri.quantity * oi.quantity) as total_qty
    FROM public.order_items oi
    JOIN public.products p ON oi.product_id = p.id
    JOIN public.recipe_ingredients ri ON ri.recipe_id = p.recipe_id
    JOIN public.ingredients i ON ri.ingredient_id = i.id
    WHERE oi.order_id = order_id_param
    GROUP BY i.id
  ) subq
  WHERE inv.ingredient_id = subq.ingredient_id;
  
  -- Return success
  result := json_build_object(
    'success', true,
    'message', 'Pedido confirmado y stock actualizado'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fix get_event_sales_stats function
CREATE OR REPLACE FUNCTION get_event_sales_stats(event_id_param UUID)
RETURNS JSON
SET search_path = ''
AS $$
DECLARE
  event_date DATE;
  total_sales DECIMAL(10, 2);
  total_items INTEGER;
  total_customers INTEGER;
  result JSON;
BEGIN
  -- Get event date
  SELECT date INTO event_date FROM public.events_calendar WHERE id = event_id_param;
  
  -- Calculate statistics for that date
  SELECT 
    COALESCE(SUM(s.total_amount), 0),
    COALESCE(SUM(si.quantity), 0),
    COUNT(DISTINCT s.customer_id)
  INTO total_sales, total_items, total_customers
  FROM public.sales s
  LEFT JOIN public.sale_items si ON s.id = si.sale_id
  WHERE s.sale_date = event_date;
  
  -- Build result JSON
  result := json_build_object(
    'event_date', event_date,
    'total_sales', total_sales,
    'total_items_sold', total_items,
    'total_customers', total_customers,
    'average_ticket', CASE WHEN total_customers > 0 THEN total_sales / total_customers ELSE 0 END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fix get_daily_sales_stats function
CREATE OR REPLACE FUNCTION get_daily_sales_stats(date_param DATE)
RETURNS JSON
SET search_path = ''
AS $$
DECLARE
  total_sales DECIMAL(10, 2);
  total_items INTEGER;
  total_customers INTEGER;
  sales_count INTEGER;
  result JSON;
BEGIN
  -- Calculate statistics for the given date
  SELECT 
    COALESCE(SUM(s.total_amount), 0),
    COALESCE(SUM(si.quantity), 0),
    COUNT(DISTINCT s.customer_id),
    COUNT(s.id)
  INTO total_sales, total_items, total_customers, sales_count
  FROM public.sales s
  LEFT JOIN public.sale_items si ON s.id = si.sale_id
  WHERE s.sale_date = date_param;
  
  -- Build result JSON
  result := json_build_object(
    'date', date_param,
    'total_sales', total_sales,
    'total_items_sold', total_items,
    'total_customers', total_customers,
    'total_sales_count', sales_count,
    'average_ticket', CASE WHEN sales_count > 0 THEN total_sales / sales_count ELSE 0 END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fix create_sale_with_items function
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
    
    -- Create sale record
    INSERT INTO public.sales (sale_date, customer_id, total_amount, payment_method, notes)
    VALUES (sale_date_param, customer_id_param, sale_total, payment_method_param, notes_param)
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
    
  EXCEPTION WHEN OTHERS THEN
    -- Return error
    RETURN json_build_object(
      'success', false,
      'message', 'Error al crear venta: ' || SQLERRM
    );
  END;
END;
$$ LANGUAGE plpgsql;
