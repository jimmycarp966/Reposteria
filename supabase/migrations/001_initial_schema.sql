-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  cost_per_unit DECIMAL(10, 2) NOT NULL CHECK (cost_per_unit >= 0),
  supplier VARCHAR(255),
  lead_time_days INTEGER CHECK (lead_time_days >= 0),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  servings INTEGER NOT NULL CHECK (servings > 0),
  version INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipe_ingredients table (many-to-many)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 3) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(50) NOT NULL,
  UNIQUE(recipe_id, ingredient_id)
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  base_cost_cache DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (base_cost_cache >= 0),
  suggested_price_cache DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (suggested_price_cache >= 0),
  sku VARCHAR(100) UNIQUE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ingredient_id)
);

-- Create inventory_movements table
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 3) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('IN', 'OUT')),
  order_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('DAILY', 'EFEMERIDE')),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED')),
  delivery_date DATE NOT NULL,
  delivery_time TIME,
  total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  production_start TIMESTAMP WITH TIME ZONE,
  production_end TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  cost_at_sale DECIMAL(10, 2) NOT NULL CHECK (cost_at_sale >= 0),
  production_time_estimate_minutes INTEGER NOT NULL DEFAULT 0 CHECK (production_time_estimate_minutes >= 0)
);

-- Create production_tasks table
CREATE TABLE IF NOT EXISTS production_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  task_name VARCHAR(255) NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 0),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED'))
);

-- Create events_calendar table
CREATE TABLE IF NOT EXISTS events_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('EFEMERIDE', 'REMINDER'))
);

-- Create price_rules table
CREATE TABLE IF NOT EXISTS price_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  markup_percent DECIMAL(5, 2) NOT NULL DEFAULT 0 CHECK (markup_percent >= 0),
  fixed_fee DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (fixed_fee >= 0),
  effective_from DATE,
  effective_to DATE,
  event_id UUID REFERENCES events_calendar(id) ON DELETE SET NULL
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);
CREATE INDEX idx_inventory_ingredient ON inventory(ingredient_id);
CREATE INDEX idx_inventory_movements_ingredient ON inventory_movements(ingredient_id);
CREATE INDEX idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_production_tasks_order_item ON production_tasks(order_item_id);
CREATE INDEX idx_events_calendar_date ON events_calendar(date);

-- Enable Row Level Security (RLS) on all tables
-- Since there's no authentication, we'll allow all operations for now
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for all operations (no authentication)
CREATE POLICY "Enable all operations for ingredients" ON ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for recipes" ON recipes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for recipe_ingredients" ON recipe_ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for inventory" ON inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for inventory_movements" ON inventory_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for production_tasks" ON production_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for events_calendar" ON events_calendar FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for price_rules" ON price_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- Function to calculate recipe cost
CREATE OR REPLACE FUNCTION calculate_recipe_cost(recipe_id_param UUID)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  total_cost DECIMAL(10, 2);
  recipe_servings INTEGER;
BEGIN
  -- Get recipe servings
  SELECT servings INTO recipe_servings FROM recipes WHERE id = recipe_id_param;
  
  -- Calculate total cost
  SELECT COALESCE(SUM(ri.quantity * i.cost_per_unit), 0)
  INTO total_cost
  FROM recipe_ingredients ri
  JOIN ingredients i ON ri.ingredient_id = i.id
  WHERE ri.recipe_id = recipe_id_param;
  
  -- Return cost per serving
  IF recipe_servings > 0 THEN
    RETURN total_cost / recipe_servings;
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check stock availability for an order
CREATE OR REPLACE FUNCTION check_stock_availability(order_id_param UUID)
RETURNS TABLE(ingredient_id UUID, ingredient_name VARCHAR, required_quantity DECIMAL, available_quantity DECIMAL, shortage DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.name,
    SUM(ri.quantity * oi.quantity) as required_qty,
    COALESCE(inv.quantity, 0) as available_qty,
    GREATEST(SUM(ri.quantity * oi.quantity) - COALESCE(inv.quantity, 0), 0) as shortage
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  JOIN recipe_ingredients ri ON ri.recipe_id = p.recipe_id
  JOIN ingredients i ON ri.ingredient_id = i.id
  LEFT JOIN inventory inv ON inv.ingredient_id = i.id
  WHERE oi.order_id = order_id_param
  GROUP BY i.id, i.name, inv.quantity
  HAVING SUM(ri.quantity * oi.quantity) > COALESCE(inv.quantity, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to confirm order and update stock (atomic transaction)
CREATE OR REPLACE FUNCTION confirm_order_and_update_stock(order_id_param UUID)
RETURNS JSON AS $$
DECLARE
  shortage_count INTEGER;
  result JSON;
BEGIN
  -- Check if there are any stock shortages
  SELECT COUNT(*) INTO shortage_count
  FROM check_stock_availability(order_id_param);
  
  IF shortage_count > 0 THEN
    -- Return error with shortage details
    SELECT json_build_object(
      'success', false,
      'message', 'Stock insuficiente',
      'shortages', json_agg(shortage_data)
    ) INTO result
    FROM check_stock_availability(order_id_param) as shortage_data;
    
    RETURN result;
  END IF;
  
  -- Update order status
  UPDATE orders SET status = 'CONFIRMED' WHERE id = order_id_param;
  
  -- Deduct stock for each ingredient
  INSERT INTO inventory_movements (ingredient_id, quantity, type, order_id, notes)
  SELECT 
    i.id,
    -SUM(ri.quantity * oi.quantity),
    'OUT',
    order_id_param,
    'Stock deducted for order confirmation'
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  JOIN recipe_ingredients ri ON ri.recipe_id = p.recipe_id
  JOIN ingredients i ON ri.ingredient_id = i.id
  WHERE oi.order_id = order_id_param
  GROUP BY i.id;
  
  -- Update inventory quantities
  UPDATE inventory inv
  SET 
    quantity = inv.quantity - subq.total_qty,
    last_updated = NOW()
  FROM (
    SELECT 
      i.id as ingredient_id,
      SUM(ri.quantity * oi.quantity) as total_qty
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN recipe_ingredients ri ON ri.recipe_id = p.recipe_id
    JOIN ingredients i ON ri.ingredient_id = i.id
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

-- Insert default settings
INSERT INTO settings (key, value) VALUES
  ('default_markup_percent', '60'),
  ('production_buffer_minutes', '120'),
  ('low_stock_threshold', '10')
ON CONFLICT (key) DO NOTHING;



