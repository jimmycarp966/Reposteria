-- Ensure UUID extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- STEP 1: Create core tables if they don't exist
-- ============================================================

-- Create ingredients table if it doesn't exist
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

-- Create inventory table if it doesn't exist
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ingredient_id)
);

-- Create inventory_movements table if it doesn't exist
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 3) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('IN', 'OUT')),
  order_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- STEP 2: Create indexes (only if columns exist)
-- ============================================================

DO $$
BEGIN
  -- Create inventory index only if ingredient_id column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory' AND column_name = 'ingredient_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_inventory_ingredient ON inventory(ingredient_id);
  END IF;

  -- Create inventory_movements index only if ingredient_id column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory_movements' AND column_name = 'ingredient_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_inventory_movements_ingredient ON inventory_movements(ingredient_id);
  END IF;
END $$;

-- ============================================================
-- STEP 3: Enable RLS and create policies
-- ============================================================

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist (using DO block for conditional creation)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ingredients' AND policyname = 'Enable all operations for ingredients') THEN
    CREATE POLICY "Enable all operations for ingredients" ON ingredients FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory' AND policyname = 'Enable all operations for inventory') THEN
    CREATE POLICY "Enable all operations for inventory" ON inventory FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_movements' AND policyname = 'Enable all operations for inventory_movements') THEN
    CREATE POLICY "Enable all operations for inventory_movements" ON inventory_movements FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- STEP 4: Create ingredient_purchases table
-- ============================================================

CREATE TABLE IF NOT EXISTS ingredient_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity_purchased DECIMAL(10, 3) NOT NULL CHECK (quantity_purchased > 0),
  unit_purchased VARCHAR(50) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
  calculated_unit_cost DECIMAL(10, 4) NOT NULL,
  supplier VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for ingredient_purchases (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ingredient_purchases') THEN
    CREATE INDEX IF NOT EXISTS idx_ingredient_purchases_ingredient ON ingredient_purchases(ingredient_id);
    CREATE INDEX IF NOT EXISTS idx_ingredient_purchases_date ON ingredient_purchases(purchase_date);
  END IF;
END $$;

-- Enable RLS for ingredient_purchases
ALTER TABLE ingredient_purchases ENABLE ROW LEVEL SECURITY;

-- Create policy for ingredient_purchases
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ingredient_purchases' AND policyname = 'Enable all operations for ingredient_purchases') THEN
    CREATE POLICY "Enable all operations for ingredient_purchases" ON ingredient_purchases 
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- STEP 5: Create helper functions for unit conversion
-- ============================================================

-- Helper function to get conversion factor between two units
CREATE OR REPLACE FUNCTION get_unit_conversion_factor(
  p_from_unit VARCHAR,
  p_to_unit VARCHAR
)
RETURNS DECIMAL AS $$
DECLARE
  conversion_map JSONB := '{
    "kg": {"g": 1000, "kg": 1, "lb": 2.20462, "oz": 35.274},
    "g": {"kg": 0.001, "g": 1, "lb": 0.00220462, "oz": 0.035274},
    "lb": {"kg": 0.453592, "g": 453.592, "lb": 1, "oz": 16},
    "oz": {"kg": 0.0283495, "g": 28.3495, "lb": 0.0625, "oz": 1},
    "l": {"ml": 1000, "l": 1, "cup": 4.22675, "tbsp": 67.628, "tsp": 202.884},
    "ml": {"l": 0.001, "ml": 1, "cup": 0.00422675, "tbsp": 0.067628, "tsp": 0.202884},
    "cup": {"l": 0.236588, "ml": 236.588, "cup": 1, "tbsp": 16, "tsp": 48},
    "tbsp": {"l": 0.0147868, "ml": 14.7868, "cup": 0.0625, "tbsp": 1, "tsp": 3},
    "tsp": {"l": 0.00492892, "ml": 4.92892, "cup": 0.0208333, "tbsp": 0.333333, "tsp": 1},
    "unit": {"unit": 1, "piece": 1, "pcs": 1},
    "piece": {"unit": 1, "piece": 1, "pcs": 1},
    "pcs": {"unit": 1, "piece": 1, "pcs": 1}
  }'::jsonb;
  
  conversion_factor DECIMAL;
BEGIN
  -- Try to get conversion factor from the map
  conversion_factor := (conversion_map -> p_from_unit -> p_to_unit)::text::DECIMAL;
  
  -- If not found, return 1 (no conversion)
  IF conversion_factor IS NULL THEN
    conversion_factor := 1;
  END IF;
  
  RETURN conversion_factor;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate unit cost with unit conversion
CREATE OR REPLACE FUNCTION calculate_ingredient_unit_cost(
  p_quantity_purchased DECIMAL,
  p_unit_purchased VARCHAR,
  p_total_price DECIMAL,
  p_base_unit VARCHAR
)
RETURNS DECIMAL AS $$
DECLARE
  converted_quantity DECIMAL;
  unit_cost DECIMAL;
BEGIN
  -- If units are the same, no conversion needed
  IF LOWER(p_unit_purchased) = LOWER(p_base_unit) THEN
    converted_quantity := p_quantity_purchased;
  ELSE
    -- Convert using the conversion factors
    converted_quantity := p_quantity_purchased * get_unit_conversion_factor(LOWER(p_unit_purchased), LOWER(p_base_unit));
  END IF;
  
  -- Calculate cost per unit
  IF converted_quantity > 0 THEN
    unit_cost := p_total_price / converted_quantity;
  ELSE
    unit_cost := 0;
  END IF;
  
  RETURN unit_cost;
END;
$$ LANGUAGE plpgsql;
