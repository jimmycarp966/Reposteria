-- ============================================================================
-- SCRIPT DE INSTALACIÓN COMPLETA - SISTEMA DE GESTIÓN PARA REPOSTERÍA
-- ============================================================================
-- Este script instala TODO el esquema de base de datos en un solo archivo
-- Es idempotente: se puede ejecutar múltiples veces sin errores
-- Fecha: 2024-12-25
-- ============================================================================

-- ============================================================================
-- PARTE 1: EXTENSIONES Y CONFIGURACIÓN INICIAL
-- ============================================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PARTE 2: ESQUEMA INICIAL (001_initial_schema.sql)
-- ============================================================================

-- Crear tabla de ingredientes
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

-- Crear tabla de recetas
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

-- Crear tabla de ingredientes de recetas (many-to-many)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 3) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(50) NOT NULL
);

-- Crear tabla de productos
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

-- Crear tabla de inventario
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ingredient_id)
);

-- Crear tabla de movimientos de inventario
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 3) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('IN', 'OUT')),
  order_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de pedidos
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
  customer_id UUID,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de items de pedidos
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  cost_at_sale DECIMAL(10, 2) NOT NULL CHECK (cost_at_sale >= 0),
  production_time_estimate_minutes INTEGER NOT NULL DEFAULT 0 CHECK (production_time_estimate_minutes >= 0)
);

-- Crear tabla de tareas de producción
CREATE TABLE IF NOT EXISTS production_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  task_name VARCHAR(255) NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 0),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED'))
);

-- Crear tabla de calendario de eventos
CREATE TABLE IF NOT EXISTS events_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('EFEMERIDE', 'REMINDER'))
);

-- Crear tabla de reglas de precio
CREATE TABLE IF NOT EXISTS price_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  markup_percent DECIMAL(5, 2) NOT NULL DEFAULT 0 CHECK (markup_percent >= 0),
  fixed_fee DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (fixed_fee >= 0),
  effective_from DATE,
  effective_to DATE,
  event_id UUID REFERENCES events_calendar(id) ON DELETE SET NULL
);

-- Crear tabla de configuración
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT NOT NULL
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_inventory_ingredient ON inventory(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_ingredient ON inventory_movements(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_production_tasks_order_item ON production_tasks(order_item_id);
CREATE INDEX IF NOT EXISTS idx_events_calendar_date ON events_calendar(date);

-- Habilitar Row Level Security (RLS) en todas las tablas
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

-- Crear políticas permisivas (sin autenticación)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ingredients' AND policyname = 'Enable all operations for ingredients') THEN
    CREATE POLICY "Enable all operations for ingredients" ON ingredients FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recipes' AND policyname = 'Enable all operations for recipes') THEN
    CREATE POLICY "Enable all operations for recipes" ON recipes FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recipe_ingredients' AND policyname = 'Enable all operations for recipe_ingredients') THEN
    CREATE POLICY "Enable all operations for recipe_ingredients" ON recipe_ingredients FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Enable all operations for products') THEN
    CREATE POLICY "Enable all operations for products" ON products FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory' AND policyname = 'Enable all operations for inventory') THEN
    CREATE POLICY "Enable all operations for inventory" ON inventory FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_movements' AND policyname = 'Enable all operations for inventory_movements') THEN
    CREATE POLICY "Enable all operations for inventory_movements" ON inventory_movements FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Enable all operations for orders') THEN
    CREATE POLICY "Enable all operations for orders" ON orders FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Enable all operations for order_items') THEN
    CREATE POLICY "Enable all operations for order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'production_tasks' AND policyname = 'Enable all operations for production_tasks') THEN
    CREATE POLICY "Enable all operations for production_tasks" ON production_tasks FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events_calendar' AND policyname = 'Enable all operations for events_calendar') THEN
    CREATE POLICY "Enable all operations for events_calendar" ON events_calendar FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'price_rules' AND policyname = 'Enable all operations for price_rules') THEN
    CREATE POLICY "Enable all operations for price_rules" ON price_rules FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Enable all operations for settings') THEN
    CREATE POLICY "Enable all operations for settings" ON settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- PARTE 3: EXTENSIÓN DE VENTAS Y EVENTOS (002_sales_and_events_extension.sql)
-- ============================================================================

-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de ventas
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  payment_method VARCHAR(20) NOT NULL DEFAULT 'efectivo' CHECK (payment_method IN ('efectivo', 'tarjeta', 'transferencia')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de items de venta
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0)
);

-- Crear tabla de productos de eventos
CREATE TABLE IF NOT EXISTS event_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events_calendar(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  special_price DECIMAL(10, 2) CHECK (special_price >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, product_id)
);

-- Crear índices para ventas y eventos
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_event_products_event ON event_products(event_id);
CREATE INDEX IF NOT EXISTS idx_event_products_product ON event_products(product_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- Habilitar RLS en nuevas tablas
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_products ENABLE ROW LEVEL SECURITY;

-- Crear políticas para nuevas tablas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Enable all operations for customers') THEN
    CREATE POLICY "Enable all operations for customers" ON customers FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sales' AND policyname = 'Enable all operations for sales') THEN
    CREATE POLICY "Enable all operations for sales" ON sales FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sale_items' AND policyname = 'Enable all operations for sale_items') THEN
    CREATE POLICY "Enable all operations for sale_items" ON sale_items FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_products' AND policyname = 'Enable all operations for event_products') THEN
    CREATE POLICY "Enable all operations for event_products" ON event_products FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- PARTE 4: ESTADO DE PAGOS (004_payment_status.sql + 007_fix_payment_constraints_step_by_step.sql)
-- ============================================================================

-- Crear ENUM para estado de pago
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
    CREATE TYPE payment_status_enum AS ENUM ('pendiente', 'parcial', 'pagado');
  END IF;
END $$;

-- Agregar campos de pago a orders (si no existen)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
    ALTER TABLE orders ADD COLUMN payment_status payment_status_enum DEFAULT 'pendiente';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'amount_paid') THEN
    ALTER TABLE orders ADD COLUMN amount_paid DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'amount_pending') THEN
    ALTER TABLE orders ADD COLUMN amount_pending DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

-- Agregar campos de pago a sales (si no existen)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'sales' AND column_name = 'payment_status') THEN
    ALTER TABLE sales ADD COLUMN payment_status payment_status_enum DEFAULT 'pendiente';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'sales' AND column_name = 'amount_paid') THEN
    ALTER TABLE sales ADD COLUMN amount_paid DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'sales' AND column_name = 'amount_pending') THEN
    ALTER TABLE sales ADD COLUMN amount_pending DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

-- Inicializar registros existentes con montos correctos
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

-- Corregir inconsistencias existentes
UPDATE orders 
SET amount_pending = total_price - COALESCE(amount_paid, 0)
WHERE amount_paid + amount_pending != total_price;

UPDATE sales 
SET amount_pending = total_amount - COALESCE(amount_paid, 0)
WHERE amount_paid + amount_pending != total_amount;

-- Actualizar estado de pago basado en montos corregidos
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

-- Agregar restricciones NOT NULL
DO $$
BEGIN
  ALTER TABLE orders 
  ALTER COLUMN payment_status SET NOT NULL,
  ALTER COLUMN amount_paid SET NOT NULL,
  ALTER COLUMN amount_pending SET NOT NULL;

  ALTER TABLE sales 
  ALTER COLUMN payment_status SET NOT NULL,
  ALTER COLUMN amount_paid SET NOT NULL,
  ALTER COLUMN amount_pending SET NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL; -- Ignorar si ya existen
END $$;

-- Agregar restricciones CHECK (solo si no existen)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_order_payment_amounts') THEN
    ALTER TABLE orders 
    ADD CONSTRAINT check_order_payment_amounts 
    CHECK (amount_paid + amount_pending = total_price);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_sale_payment_amounts') THEN
    ALTER TABLE sales 
    ADD CONSTRAINT check_sale_payment_amounts 
    CHECK (amount_paid + amount_pending = total_amount);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_order_amounts_positive') THEN
    ALTER TABLE orders 
    ADD CONSTRAINT check_order_amounts_positive 
    CHECK (amount_paid >= 0 AND amount_pending >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_sale_amounts_positive') THEN
    ALTER TABLE sales 
    ADD CONSTRAINT check_sale_amounts_positive 
    CHECK (amount_paid >= 0 AND amount_pending >= 0);
  END IF;
END $$;

-- Crear índices para estado de pago
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_pending_amount ON orders(amount_pending) WHERE payment_status IN ('pendiente', 'parcial');
CREATE INDEX IF NOT EXISTS idx_sales_pending_amount ON sales(amount_pending) WHERE payment_status IN ('pendiente', 'parcial');

-- ============================================================================
-- PARTE 5: PLAN SEMANAL DE PRODUCCIÓN (005_weekly_production_plan.sql)
-- ============================================================================

-- Crear ENUM para estado de tarea
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status_enum') THEN
    CREATE TYPE task_status_enum AS ENUM ('pendiente', 'en_progreso', 'completada');
  END IF;
END $$;

-- Crear tabla de planes semanales de producción
CREATE TABLE IF NOT EXISTS weekly_production_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT check_week_start_monday CHECK (EXTRACT(DOW FROM week_start_date) = 1),
  CONSTRAINT check_week_end_sunday CHECK (EXTRACT(DOW FROM week_end_date) = 0),
  CONSTRAINT check_week_duration CHECK (week_end_date >= week_start_date + INTERVAL '5 days' AND week_end_date <= week_start_date + INTERVAL '7 days'),
  
  UNIQUE(week_start_date)
);

-- Crear tabla de tareas semanales de producción
CREATE TABLE IF NOT EXISTS weekly_production_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES weekly_production_plans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
  task_description TEXT NOT NULL,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  estimated_time_minutes INTEGER CHECK (estimated_time_minutes >= 0),
  status task_status_enum NOT NULL DEFAULT 'pendiente',
  completed_at TIMESTAMP WITH TIME ZONE,
  order_position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT check_completed_at CHECK (
    (status = 'completada' AND completed_at IS NOT NULL) OR
    (status != 'completada' AND completed_at IS NULL)
  )
);

-- Crear índices para planes semanales
CREATE INDEX IF NOT EXISTS idx_weekly_plans_week_start ON weekly_production_plans(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_week_range ON weekly_production_plans(week_start_date, week_end_date);
CREATE INDEX IF NOT EXISTS idx_weekly_tasks_plan_day ON weekly_production_tasks(plan_id, day_of_week, order_position);
CREATE INDEX IF NOT EXISTS idx_weekly_tasks_status ON weekly_production_tasks(status);
CREATE INDEX IF NOT EXISTS idx_weekly_tasks_recipe ON weekly_production_tasks(recipe_id) WHERE recipe_id IS NOT NULL;

-- Habilitar RLS
ALTER TABLE weekly_production_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_production_tasks ENABLE ROW LEVEL SECURITY;

-- Crear políticas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'weekly_production_plans' AND policyname = 'Enable all operations for weekly_production_plans') THEN
    CREATE POLICY "Enable all operations for weekly_production_plans" ON weekly_production_plans FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'weekly_production_tasks' AND policyname = 'Enable all operations for weekly_production_tasks') THEN
    CREATE POLICY "Enable all operations for weekly_production_tasks" ON weekly_production_tasks FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Función para actualizar completed_at automáticamente
CREATE OR REPLACE FUNCTION update_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completada' AND OLD.status != 'completada' THEN
    NEW.completed_at := NOW();
  END IF;
  
  IF NEW.status != 'completada' AND OLD.status = 'completada' THEN
    NEW.completed_at := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar completed_at
DROP TRIGGER IF EXISTS trigger_update_task_completed_at ON weekly_production_tasks;
CREATE TRIGGER trigger_update_task_completed_at
  BEFORE UPDATE ON weekly_production_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_completed_at();

-- ============================================================================
-- PARTE 6: ELIMINAR RESTRICCIÓN ÚNICA (008_remove_recipe_ingredients_unique_constraint.sql)
-- ============================================================================

-- Eliminar restricción única en recipe_ingredients
DO $$
BEGIN
  ALTER TABLE recipe_ingredients 
  DROP CONSTRAINT IF EXISTS recipe_ingredients_recipe_id_ingredient_id_key;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Crear índice sin restricción de unicidad
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_ingredient 
ON recipe_ingredients(recipe_id, ingredient_id);

-- ============================================================================
-- PARTE 7: CATEGORÍAS DE TAREAS (011_add_task_categories.sql)
-- ============================================================================

-- Crear tabla de categorías de tareas
CREATE TABLE IF NOT EXISTS task_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  color VARCHAR(7) NOT NULL DEFAULT '#808080',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar category_id a weekly_production_tasks
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'weekly_production_tasks' AND column_name = 'category_id') THEN
    ALTER TABLE weekly_production_tasks
    ADD COLUMN category_id UUID REFERENCES task_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;

-- Crear política
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'task_categories' AND policyname = 'Enable all operations for authenticated users') THEN
    CREATE POLICY "Enable all operations for authenticated users" ON task_categories FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Insertar categorías por defecto
INSERT INTO task_categories (name, color)
VALUES
  ('Preparación de Masas', '#FFC8DD'),
  ('Horneado', '#FFD700'),
  ('Decoración', '#A2D2FF'),
  ('Limpieza', '#C0C0C0'),
  ('Empaquetado', '#BDE0FE'),
  ('Compras', '#A8D8B9')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- PARTE 8: COMPRAS DE INGREDIENTES (017_add_ingredient_purchases.sql)
-- ============================================================================

-- Crear tabla de compras de ingredientes
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

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_ingredient_purchases_ingredient ON ingredient_purchases(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_purchases_date ON ingredient_purchases(purchase_date);

-- Habilitar RLS
ALTER TABLE ingredient_purchases ENABLE ROW LEVEL SECURITY;

-- Crear política
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ingredient_purchases' AND policyname = 'Enable all operations for ingredient_purchases') THEN
    CREATE POLICY "Enable all operations for ingredient_purchases" ON ingredient_purchases 
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- PARTE 9: TOKENS DE NOTIFICACIÓN (20241224_notification_tokens.sql)
-- ============================================================================

-- Crear tabla de tokens de notificación
CREATE TABLE IF NOT EXISTS notification_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  user_id UUID,
  device_info JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_notification_tokens_token ON notification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_user_id ON notification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_active ON notification_tokens(is_active) WHERE is_active = true;

-- Habilitar RLS
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;

-- Crear política (sin autenticación, permitir todo)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_tokens' AND policyname = 'Users can manage their own notification tokens') THEN
    CREATE POLICY "Users can manage their own notification tokens" ON notification_tokens
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Función para limpiar tokens antiguos
CREATE OR REPLACE FUNCTION cleanup_old_notification_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM notification_tokens 
  WHERE is_active = false 
  AND updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_notification_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_update_notification_tokens_updated_at ON notification_tokens;
CREATE TRIGGER trigger_update_notification_tokens_updated_at
  BEFORE UPDATE ON notification_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_tokens_updated_at();

-- ============================================================================
-- PARTE 10: HISTORIAL DE PRECIOS (20241225_price_history.sql)
-- ============================================================================

-- Crear tabla de historial de precios de productos
CREATE TABLE IF NOT EXISTS product_price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2) NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by UUID,
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de historial de precios de ingredientes
CREATE TABLE IF NOT EXISTS ingredient_price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2) NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by UUID,
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_product_price_history_product_id ON product_price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_price_history_changed_at ON product_price_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingredient_price_history_ingredient_id ON ingredient_price_history(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_price_history_changed_at ON ingredient_price_history(changed_at DESC);

-- Habilitar RLS
ALTER TABLE product_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_price_history ENABLE ROW LEVEL SECURITY;

-- Crear políticas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_price_history' AND policyname = 'Users can view product price history') THEN
    CREATE POLICY "Users can view product price history" ON product_price_history
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_price_history' AND policyname = 'Users can insert product price history') THEN
    CREATE POLICY "Users can insert product price history" ON product_price_history
      FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ingredient_price_history' AND policyname = 'Users can view ingredient price history') THEN
    CREATE POLICY "Users can view ingredient price history" ON ingredient_price_history
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ingredient_price_history' AND policyname = 'Users can insert ingredient price history') THEN
    CREATE POLICY "Users can insert ingredient price history" ON ingredient_price_history
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- PARTE 11: FUNCIONES PRINCIPALES
-- ============================================================================

-- Función para calcular costo de receta
CREATE OR REPLACE FUNCTION calculate_recipe_cost(recipe_id_param UUID)
RETURNS DECIMAL(10, 2) 
SET search_path = ''
AS $$
DECLARE
  total_cost DECIMAL(10, 2);
  recipe_servings INTEGER;
BEGIN
  SELECT servings INTO recipe_servings FROM public.recipes WHERE id = recipe_id_param;
  
  SELECT COALESCE(SUM(ri.quantity * i.cost_per_unit), 0)
  INTO total_cost
  FROM public.recipe_ingredients ri
  JOIN public.ingredients i ON ri.ingredient_id = i.id
  WHERE ri.recipe_id = recipe_id_param;
  
  IF recipe_servings > 0 THEN
    RETURN total_cost / recipe_servings;
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar disponibilidad de stock
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

-- Función para confirmar pedido y actualizar stock
CREATE OR REPLACE FUNCTION confirm_order_and_update_stock(
  order_id_param UUID,
  force_confirm_param BOOLEAN DEFAULT FALSE
) RETURNS JSONB 
SET search_path = ''
AS $$
DECLARE
  shortages_found JSONB[];
  has_shortages BOOLEAN := FALSE;
BEGIN
  WITH required_ingredients AS (
    SELECT 
      i.id AS ingredient_id,
      i.name AS ingredient_name,
      SUM(ri.quantity * oi.quantity) AS required_quantity,
      inv.quantity AS available_quantity
    FROM public.orders o
    JOIN public.order_items oi ON o.id = oi.order_id
    JOIN public.products p ON oi.product_id = p.id
    JOIN public.recipes r ON p.recipe_id = r.id
    JOIN public.recipe_ingredients ri ON r.id = ri.recipe_id
    JOIN public.ingredients i ON ri.ingredient_id = i.id
    JOIN public.inventory inv ON i.id = inv.ingredient_id
    WHERE o.id = order_id_param
    GROUP BY i.id, i.name, inv.quantity
  )
  SELECT array_agg(
    jsonb_build_object(
      'ingredient_id', ingredient_id,
      'ingredient_name', ingredient_name,
      'required_quantity', required_quantity,
      'available_quantity', available_quantity,
      'shortage', required_quantity - available_quantity
    )
  )
  INTO shortages_found
  FROM required_ingredients
  WHERE required_quantity > available_quantity;

  IF shortages_found IS NOT NULL AND NOT force_confirm_param THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'Stock insuficiente',
      'shortages', shortages_found
    );
  END IF;

  has_shortages := shortages_found IS NOT NULL;

  UPDATE public.orders 
  SET status = 'CONFIRMED'
  WHERE id = order_id_param;

  IF NOT has_shortages THEN
    WITH required_ingredients AS (
      SELECT 
        i.id AS ingredient_id,
        SUM(ri.quantity * oi.quantity) AS total_quantity
      FROM public.orders o
      JOIN public.order_items oi ON o.id = oi.order_id
      JOIN public.products p ON oi.product_id = p.id
      JOIN public.recipes r ON p.recipe_id = r.id
      JOIN public.recipe_ingredients ri ON r.id = ri.recipe_id
      JOIN public.ingredients i ON ri.ingredient_id = i.id
      WHERE o.id = order_id_param
      GROUP BY i.id
    )
    INSERT INTO public.inventory_movements (
      ingredient_id,
      quantity,
      type,
      order_id,
      notes
    )
    SELECT 
      ingredient_id,
      -total_quantity,
      'OUT',
      order_id_param,
      'Pedido confirmado'
    FROM required_ingredients;

    UPDATE public.inventory inv
    SET quantity = inv.quantity - ri.total_quantity
    FROM (
      SELECT 
        i.id as ingredient_id,
        SUM(ri.quantity * oi.quantity) as total_quantity
      FROM public.orders o
      JOIN public.order_items oi ON o.id = oi.order_id
      JOIN public.products p ON oi.product_id = p.id
      JOIN public.recipes r ON p.recipe_id = r.id
      JOIN public.recipe_ingredients ri ON r.id = ri.recipe_id
      JOIN public.ingredients i ON ri.ingredient_id = i.id
      WHERE o.id = order_id_param
      GROUP BY i.id
    ) ri
    WHERE inv.ingredient_id = ri.ingredient_id;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', CASE 
      WHEN has_shortages THEN 'Pedido confirmado con faltantes'
      ELSE 'Pedido confirmado exitosamente'
    END,
    'has_shortages', has_shortages
  );
END;
$$ LANGUAGE plpgsql;

-- Función para registrar pagos
CREATE OR REPLACE FUNCTION register_payment(
  table_name_param TEXT,
  record_id_param UUID,
  payment_amount_param DECIMAL(10,2)
) RETURNS JSON 
SET search_path = ''
AS $$
DECLARE
  current_paid DECIMAL(10,2);
  current_pending DECIMAL(10,2);
  current_total DECIMAL(10,2);
  new_paid DECIMAL(10,2);
  new_pending DECIMAL(10,2);
  new_status payment_status_enum;
  result JSON;
BEGIN
  IF payment_amount_param <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'El monto del pago debe ser mayor a 0'
    );
  END IF;

  IF table_name_param = 'orders' THEN
    SELECT amount_paid, amount_pending, total_price
    INTO current_paid, current_pending, current_total
    FROM public.orders WHERE id = record_id_param;
  ELSIF table_name_param = 'sales' THEN
    SELECT amount_paid, amount_pending, total_amount
    INTO current_paid, current_pending, current_total
    FROM public.sales WHERE id = record_id_param;
  ELSE
    RETURN json_build_object(
      'success', false,
      'message', 'Tabla inválida. Use "orders" o "sales"'
    );
  END IF;

  IF current_total IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Registro no encontrado'
    );
  END IF;

  new_paid := current_paid + payment_amount_param;
  new_pending := current_total - new_paid;

  IF new_paid > current_total THEN
    RETURN json_build_object(
      'success', false,
      'message', 'El pago excede el monto total. Máximo permitido: ' || (current_total - current_paid)
    );
  END IF;

  IF new_pending = 0 THEN
    new_status := 'pagado';
  ELSIF new_paid = 0 THEN
    new_status := 'pendiente';
  ELSE
    new_status := 'parcial';
  END IF;

  IF table_name_param = 'orders' THEN
    UPDATE public.orders 
    SET 
      amount_paid = new_paid,
      amount_pending = new_pending,
      payment_status = new_status
    WHERE id = record_id_param;
  ELSIF table_name_param = 'sales' THEN
    UPDATE public.sales 
    SET 
      amount_paid = new_paid,
      amount_pending = new_pending,
      payment_status = new_status
    WHERE id = record_id_param;
  END IF;

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

-- Función para obtener cuentas por cobrar
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
) 
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    'pedido'::TEXT as type,
    COALESCE(o.customer_name, 'Sin cliente')::TEXT as customer_name,
    o.total_price as total_amount,
    o.amount_paid,
    o.amount_pending,
    o.payment_status,
    o.created_at::DATE as created_date,
    o.delivery_date as due_date
  FROM public.orders o
  WHERE o.payment_status IN ('pendiente', 'parcial')
    AND o.status != 'CANCELLED'
  
  UNION ALL
  
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
  FROM public.sales s
  LEFT JOIN public.customers c ON s.customer_id = c.id
  WHERE s.payment_status IN ('pendiente', 'parcial')
  
  ORDER BY due_date ASC, created_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para crear venta con items
CREATE OR REPLACE FUNCTION create_sale_with_items(
  sale_date_param DATE,
  sale_items_param JSONB,
  customer_id_param UUID DEFAULT NULL,
  payment_method_param VARCHAR(20) DEFAULT 'efectivo',
  notes_param TEXT DEFAULT NULL
) RETURNS JSON 
SET search_path = ''
AS $$
DECLARE
  new_sale_id UUID;
  total_amount DECIMAL(10,2) := 0;
  item_data JSONB;
  item_total DECIMAL(10,2);
BEGIN
  FOR item_data IN SELECT * FROM jsonb_array_elements(sale_items_param)
  LOOP
    item_total := (item_data->>'quantity')::DECIMAL * (item_data->>'unit_price')::DECIMAL;
    total_amount := total_amount + item_total;
  END LOOP;

  INSERT INTO public.sales (
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
    'pagado',
    total_amount,
    0,
    notes_param
  ) RETURNING id INTO new_sale_id;

  FOR item_data IN SELECT * FROM jsonb_array_elements(sale_items_param)
  LOOP
    INSERT INTO public.sale_items (
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

-- Función para completar pedido y crear venta
CREATE OR REPLACE FUNCTION complete_order_and_create_sale(
  order_id_param UUID,
  payment_status_param VARCHAR(20) DEFAULT 'pendiente'
)
RETURNS JSON 
SET search_path = ''
AS $$
DECLARE
  order_record RECORD;
  sale_id UUID;
  sale_total DECIMAL(10, 2);
  result JSON;
BEGIN
  SELECT * INTO order_record
  FROM public.orders 
  WHERE id = order_id_param 
    AND status IN ('CONFIRMED', 'IN_PRODUCTION')
    AND status != 'COMPLETED';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Pedido no encontrado o no se puede completar'
    );
  END IF;
  
  sale_total := order_record.total_price;
  
  INSERT INTO public.sales (
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
    NULL,
    sale_total,
    'efectivo',
    payment_status_param,
    CASE WHEN payment_status_param = 'pagado' THEN sale_total ELSE 0 END,
    CASE WHEN payment_status_param = 'pagado' THEN 0 ELSE sale_total END,
    'Venta generada automáticamente desde pedido completado'
  ) RETURNING id INTO sale_id;
  
  INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, subtotal)
  SELECT 
    sale_id,
    oi.product_id,
    oi.quantity,
    oi.unit_price,
    oi.quantity * oi.unit_price
  FROM public.order_items oi
  WHERE oi.order_id = order_id_param;
  
  UPDATE public.orders 
  SET status = 'COMPLETED'
  WHERE id = order_id_param;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Pedido completado y venta creada exitosamente',
    'sale_id', sale_id,
    'total_amount', sale_total
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'message', 'Error al completar pedido: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de ventas diarias
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
  SELECT 
    COALESCE(SUM(s.total_amount), 0),
    COALESCE(SUM(si.quantity), 0),
    COUNT(DISTINCT s.customer_id),
    COUNT(s.id)
  INTO total_sales, total_items, total_customers, sales_count
  FROM public.sales s
  LEFT JOIN public.sale_items si ON s.id = si.sale_id
  WHERE s.sale_date = date_param;
  
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

-- Función para obtener estadísticas de ventas de eventos
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
  SELECT date INTO event_date FROM public.events_calendar WHERE id = event_id_param;
  
  SELECT 
    COALESCE(SUM(s.total_amount), 0),
    COALESCE(SUM(si.quantity), 0),
    COUNT(DISTINCT s.customer_id)
  INTO total_sales, total_items, total_customers
  FROM public.sales s
  LEFT JOIN public.sale_items si ON s.id = si.sale_id
  WHERE s.sale_date = event_date;
  
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

-- Función para crear plan semanal
CREATE OR REPLACE FUNCTION create_weekly_plan(
  week_start_param DATE,
  notes_param TEXT DEFAULT NULL
)
RETURNS JSON 
SET search_path = ''
AS $$
DECLARE
  new_plan_id UUID;
  week_end_date DATE;
  result JSON;
BEGIN
  IF EXTRACT(DOW FROM week_start_param) != 1 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'La fecha de inicio debe ser un lunes'
    );
  END IF;
  
  IF EXISTS(SELECT 1 FROM public.weekly_production_plans WHERE week_start_date = week_start_param) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Ya existe un plan para esta semana'
    );
  END IF;
  
  week_end_date := week_start_param + INTERVAL '6 days';
  
  INSERT INTO public.weekly_production_plans (week_start_date, week_end_date, notes)
  VALUES (week_start_param, week_end_date, notes_param)
  RETURNING id INTO new_plan_id;
  
  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'id', new_plan_id,
      'week_start_date', week_start_param,
      'week_end_date', week_end_date,
      'notes', notes_param
    ),
    'message', 'Plan semanal creado exitosamente'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Error al crear plan semanal: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Función para obtener plan semanal con tareas
CREATE OR REPLACE FUNCTION get_weekly_plan_with_tasks(week_start_param DATE)
RETURNS JSON 
SET search_path = ''
AS $$
DECLARE
  plan_record weekly_production_plans%ROWTYPE;
  tasks_json JSON;
  result_json JSON;
BEGIN
  SELECT *
  INTO plan_record
  FROM public.weekly_production_plans
  WHERE week_start_date = week_start_param;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', true,
      'message', 'No hay plan para esta semana',
      'data', null
    );
  END IF;

  SELECT COALESCE(
    json_agg(
      json_build_object(
        'id', wpt.id,
        'day_of_week', wpt.day_of_week,
        'task_description', wpt.task_description,
        'recipe_id', wpt.recipe_id,
        'estimated_time_minutes', wpt.estimated_time_minutes,
        'status', wpt.status,
        'completed_at', wpt.completed_at,
        'order_position', wpt.order_position,
        'category_id', wpt.category_id,
        'recipe', CASE 
          WHEN wpt.recipe_id IS NOT NULL THEN
            json_build_object(
              'id', r.id,
              'name', r.name,
              'image_url', r.image_url
            )
          ELSE NULL
        END,
        'category', CASE
          WHEN wpt.category_id IS NOT NULL THEN
            json_build_object(
              'id', tc.id,
              'name', tc.name,
              'color', tc.color
            )
          ELSE NULL
        END
      ) ORDER BY wpt.day_of_week, wpt.order_position
    ) FILTER (WHERE wpt.id IS NOT NULL),
    '[]'::json
  )
  INTO tasks_json
  FROM public.weekly_production_tasks wpt
  LEFT JOIN public.recipes r ON wpt.recipe_id = r.id
  LEFT JOIN public.task_categories tc ON wpt.category_id = tc.id
  WHERE wpt.plan_id = plan_record.id;

  result_json := json_build_object(
    'success', true,
    'message', 'Plan semanal obtenido exitosamente',
    'data', jsonb_set(
      to_jsonb(plan_record),
      '{tasks}',
      tasks_json::jsonb
    )
  );

  RETURN result_json;
END;
$$ LANGUAGE plpgsql;

-- Función para duplicar plan semanal
CREATE OR REPLACE FUNCTION duplicate_weekly_plan(
  source_week_start_param DATE,
  target_week_start_param DATE
) RETURNS JSON 
SET search_path = ''
AS $$
DECLARE
  source_plan_id UUID;
  new_plan_id UUID;
  target_week_end_param DATE;
  new_plan_record weekly_production_plans%ROWTYPE;
BEGIN
  IF EXISTS (SELECT 1 FROM public.weekly_production_plans WHERE week_start_date = target_week_start_param) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Ya existe un plan para la semana de destino.'
    );
  END IF;

  SELECT id INTO source_plan_id
  FROM public.weekly_production_plans
  WHERE week_start_date = source_week_start_param;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No se encontró el plan de origen para duplicar.'
    );
  END IF;

  target_week_end_param := target_week_start_param + INTERVAL '6 days';

  INSERT INTO public.weekly_production_plans (week_start_date, week_end_date, notes)
  SELECT target_week_start_param, target_week_end_param, 'Copia de la semana ' || to_char(source_week_start_param, 'DD/MM/YYYY')
  FROM public.weekly_production_plans
  WHERE id = source_plan_id
  RETURNING * INTO new_plan_record;
  
  new_plan_id := new_plan_record.id;

  INSERT INTO public.weekly_production_tasks (
    plan_id,
    day_of_week,
    task_description,
    recipe_id,
    estimated_time_minutes,
    status,
    order_position,
    category_id
  )
  SELECT
    new_plan_id,
    wpt.day_of_week,
    wpt.task_description,
    wpt.recipe_id,
    wpt.estimated_time_minutes,
    'pendiente' AS status,
    wpt.order_position,
    wpt.category_id
  FROM public.weekly_production_tasks wpt
  WHERE wpt.plan_id = source_plan_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Plan semanal duplicado exitosamente.',
    'data', row_to_json(new_plan_record)
  );
END;
$$ LANGUAGE plpgsql;

-- Función para verificar stock de plan semanal
CREATE OR REPLACE FUNCTION check_stock_for_plan(plan_id_param UUID)
RETURNS TABLE (
  ingredient_id UUID,
  ingredient_name VARCHAR,
  required_quantity NUMERIC,
  available_quantity NUMERIC,
  shortage NUMERIC,
  unit VARCHAR
)
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  WITH required_ingredients AS (
    SELECT
      ri.ingredient_id,
      SUM(ri.quantity) AS total_required
    FROM public.weekly_production_tasks wpt
    JOIN public.recipes r ON wpt.recipe_id = r.id
    JOIN public.recipe_ingredients ri ON r.id = ri.recipe_id
    WHERE wpt.plan_id = plan_id_param
      AND wpt.recipe_id IS NOT NULL
    GROUP BY ri.ingredient_id
  )
  SELECT
    req.ingredient_id,
    i.name AS ingredient_name,
    req.total_required AS required_quantity,
    COALESCE(inv.quantity, 0) AS available_quantity,
    (req.total_required - COALESCE(inv.quantity, 0)) AS shortage,
    i.unit
  FROM required_ingredients req
  JOIN public.ingredients i ON req.ingredient_id = i.id
  LEFT JOIN public.inventory inv ON req.ingredient_id = inv.ingredient_id
  WHERE req.total_required > COALESCE(inv.quantity, 0);
END;
$$ LANGUAGE plpgsql;

-- Función para reordenar tareas
CREATE OR REPLACE FUNCTION update_tasks_order(tasks JSONB)
RETURNS void
SET search_path = ''
AS $$
DECLARE
  task JSONB;
BEGIN
  FOR task IN SELECT * FROM jsonb_array_elements(tasks)
  LOOP
    UPDATE public.weekly_production_tasks
    SET
      day_of_week = (task->>'day_of_week')::integer,
      order_position = (task->>'order_position')::integer
    WHERE
      id = (task->>'id')::uuid;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de plan semanal
CREATE OR REPLACE FUNCTION get_weekly_plan_stats(plan_id_param UUID)
RETURNS JSON 
SET search_path = ''
AS $$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
  total_time INTEGER;
  completed_time INTEGER;
  tasks_by_day JSON;
  result JSON;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completada'),
    COALESCE(SUM(estimated_time_minutes), 0),
    COALESCE(SUM(estimated_time_minutes) FILTER (WHERE status = 'completada'), 0)
  INTO total_tasks, completed_tasks, total_time, completed_time
  FROM public.weekly_production_tasks
  WHERE plan_id = plan_id_param;
  
  SELECT json_agg(
    json_build_object(
      'day_of_week', day_of_week,
      'total_tasks', task_count,
      'completed_tasks', completed_count,
      'total_time_minutes', total_time_min,
      'completed_time_minutes', completed_time_min
    ) ORDER BY day_of_week
  ) INTO tasks_by_day
  FROM (
    SELECT 
      day_of_week,
      COUNT(*) as task_count,
      COUNT(*) FILTER (WHERE status = 'completada') as completed_count,
      COALESCE(SUM(estimated_time_minutes), 0) as total_time_min,
      COALESCE(SUM(estimated_time_minutes) FILTER (WHERE status = 'completada'), 0) as completed_time_min
    FROM public.weekly_production_tasks
    WHERE plan_id = plan_id_param
    GROUP BY day_of_week
  ) day_stats;
  
  result := json_build_object(
    'success', true,
    'data', json_build_object(
      'total_tasks', total_tasks,
      'completed_tasks', completed_tasks,
      'completion_percentage', CASE 
        WHEN total_tasks > 0 THEN ROUND((completed_tasks::DECIMAL / total_tasks * 100), 2)
        ELSE 0 
      END,
      'total_time_minutes', total_time,
      'completed_time_minutes', completed_time,
      'time_completion_percentage', CASE 
        WHEN total_time > 0 THEN ROUND((completed_time::DECIMAL / total_time * 100), 2)
        ELSE 0 
      END,
      'tasks_by_day', COALESCE(tasks_by_day, '[]'::json)
    )
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Funciones de conversión de unidades para compras
CREATE OR REPLACE FUNCTION get_unit_conversion_factor(
  p_from_unit VARCHAR,
  p_to_unit VARCHAR
)
RETURNS DECIMAL 
SET search_path = ''
AS $$
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
  conversion_factor := (conversion_map -> p_from_unit -> p_to_unit)::text::DECIMAL;
  
  IF conversion_factor IS NULL THEN
    conversion_factor := 1;
  END IF;
  
  RETURN conversion_factor;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_ingredient_unit_cost(
  p_quantity_purchased DECIMAL,
  p_unit_purchased VARCHAR,
  p_total_price DECIMAL,
  p_base_unit VARCHAR
)
RETURNS DECIMAL 
SET search_path = ''
AS $$
DECLARE
  converted_quantity DECIMAL;
  unit_cost DECIMAL;
BEGIN
  IF LOWER(p_unit_purchased) = LOWER(p_base_unit) THEN
    converted_quantity := p_quantity_purchased;
  ELSE
    converted_quantity := p_quantity_purchased * get_unit_conversion_factor(LOWER(p_unit_purchased), LOWER(p_base_unit));
  END IF;
  
  IF converted_quantity > 0 THEN
    unit_cost := p_total_price / converted_quantity;
  ELSE
    unit_cost := 0;
  END IF;
  
  RETURN unit_cost;
END;
$$ LANGUAGE plpgsql;

-- Funciones de historial de precios
CREATE OR REPLACE FUNCTION log_product_price_change()
RETURNS TRIGGER 
SET search_path = ''
AS $$
BEGIN
  IF OLD.suggested_price_cache IS DISTINCT FROM NEW.suggested_price_cache THEN
    INSERT INTO public.product_price_history (
      product_id,
      old_price,
      new_price,
      changed_by,
      change_reason
    ) VALUES (
      NEW.id,
      OLD.suggested_price_cache,
      NEW.suggested_price_cache,
      NULL,
      'Precio actualizado'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_ingredient_price_change()
RETURNS TRIGGER 
SET search_path = ''
AS $$
BEGIN
  IF OLD.cost_per_unit IS DISTINCT FROM NEW.cost_per_unit THEN
    INSERT INTO public.ingredient_price_history (
      ingredient_id,
      old_price,
      new_price,
      changed_by,
      change_reason
    ) VALUES (
      NEW.id,
      OLD.cost_per_unit,
      NEW.cost_per_unit,
      NULL,
      'Precio por unidad actualizado'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para historial de precios
DROP TRIGGER IF EXISTS trigger_log_product_price_change ON products;
CREATE TRIGGER trigger_log_product_price_change
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION log_product_price_change();

DROP TRIGGER IF EXISTS trigger_log_ingredient_price_change ON ingredients;
CREATE TRIGGER trigger_log_ingredient_price_change
  AFTER UPDATE ON ingredients
  FOR EACH ROW
  EXECUTE FUNCTION log_ingredient_price_change();

-- Funciones para obtener historial de precios
CREATE OR REPLACE FUNCTION get_product_price_history(product_uuid UUID)
RETURNS TABLE (
  id UUID,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2),
  changed_at TIMESTAMP WITH TIME ZONE,
  changed_by UUID,
  change_reason TEXT,
  price_change DECIMAL(10,2),
  price_change_percentage DECIMAL(5,2)
) 
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pph.id,
    pph.old_price,
    pph.new_price,
    pph.changed_at,
    pph.changed_by,
    pph.change_reason,
    (pph.new_price - COALESCE(pph.old_price, 0)) as price_change,
    CASE 
      WHEN pph.old_price > 0 THEN 
        ROUND(((pph.new_price - pph.old_price) / pph.old_price) * 100, 2)
      ELSE 0
    END as price_change_percentage
  FROM public.product_price_history pph
  WHERE pph.product_id = product_uuid
  ORDER BY pph.changed_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_ingredient_price_history(ingredient_uuid UUID)
RETURNS TABLE (
  id UUID,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2),
  changed_at TIMESTAMP WITH TIME ZONE,
  changed_by UUID,
  change_reason TEXT,
  price_change DECIMAL(10,2),
  price_change_percentage DECIMAL(5,2)
) 
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    iph.id,
    iph.old_price,
    iph.new_price,
    iph.changed_at,
    iph.changed_by,
    iph.change_reason,
    (iph.new_price - COALESCE(iph.old_price, 0)) as price_change,
    CASE 
      WHEN iph.old_price > 0 THEN 
        ROUND(((iph.new_price - iph.old_price) / iph.old_price) * 100, 2)
      ELSE 0
    END as price_change_percentage
  FROM public.ingredient_price_history iph
  WHERE iph.ingredient_id = ingredient_uuid
  ORDER BY iph.changed_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTE 12: CONFIGURACIÓN INICIAL
-- ============================================================================

-- Insertar configuración por defecto
INSERT INTO settings (key, value) VALUES
  ('default_markup_percent', '60'),
  ('production_buffer_minutes', '120'),
  ('low_stock_threshold', '10')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- FIN DEL SCRIPT DE INSTALACIÓN
-- ============================================================================
-- 
-- Para cargar datos de ejemplo, ejecuta también: supabase/seeds.sql
-- 
-- Verificación rápida:
-- SELECT COUNT(*) FROM ingredients;
-- SELECT COUNT(*) FROM recipes;
-- SELECT COUNT(*) FROM products;
-- ============================================================================


