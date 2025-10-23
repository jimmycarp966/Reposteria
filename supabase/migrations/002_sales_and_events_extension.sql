-- Migration: Sales and Events Extension
-- Adds support for daily sales tracking and event products management

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  payment_method VARCHAR(20) NOT NULL DEFAULT 'efectivo' CHECK (payment_method IN ('efectivo', 'tarjeta', 'transferencia')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sale_items table
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0)
);

-- Create event_products table
CREATE TABLE IF NOT EXISTS event_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events_calendar(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  special_price DECIMAL(10, 2) CHECK (special_price >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, product_id)
);

-- Create indexes for better performance
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);
CREATE INDEX idx_event_products_event ON event_products(event_id);
CREATE INDEX idx_event_products_product ON event_products(product_id);
CREATE INDEX idx_customers_name ON customers(name);

-- Enable Row Level Security (RLS) on all new tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_products ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for all operations (no authentication)
CREATE POLICY "Enable all operations for customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for sale_items" ON sale_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for event_products" ON event_products FOR ALL USING (true) WITH CHECK (true);

-- Function to get event sales statistics
CREATE OR REPLACE FUNCTION get_event_sales_stats(event_id_param UUID)
RETURNS JSON AS $$
DECLARE
  event_date DATE;
  total_sales DECIMAL(10, 2);
  total_items INTEGER;
  total_customers INTEGER;
  result JSON;
BEGIN
  -- Get event date
  SELECT date INTO event_date FROM events_calendar WHERE id = event_id_param;
  
  -- Calculate statistics for that date
  SELECT 
    COALESCE(SUM(s.total_amount), 0),
    COALESCE(SUM(si.quantity), 0),
    COUNT(DISTINCT s.customer_id)
  INTO total_sales, total_items, total_customers
  FROM sales s
  LEFT JOIN sale_items si ON s.id = si.sale_id
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

-- Function to get daily sales statistics
CREATE OR REPLACE FUNCTION get_daily_sales_stats(date_param DATE)
RETURNS JSON AS $$
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
  FROM sales s
  LEFT JOIN sale_items si ON s.id = si.sale_id
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

-- Function to create sale with items (atomic transaction)
CREATE OR REPLACE FUNCTION create_sale_with_items(
  sale_date_param DATE,
  sale_items_param JSONB,
  customer_id_param UUID DEFAULT NULL,
  payment_method_param VARCHAR(20) DEFAULT 'efectivo',
  notes_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
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
    INSERT INTO sales (sale_date, customer_id, total_amount, payment_method, notes)
    VALUES (sale_date_param, customer_id_param, sale_total, payment_method_param, notes_param)
    RETURNING id INTO new_sale_id;
    
    -- Create sale items
    FOR item_data IN SELECT jsonb_array_elements(sale_items_param)
    LOOP
      INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
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
