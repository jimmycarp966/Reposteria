-- Migration: Create weekly production plan tables
-- Date: 2024-12-19
-- Description: Add tables for weekly production planning with tasks and recipes

-- Create ENUM for task status
CREATE TYPE task_status_enum AS ENUM ('pendiente', 'en_progreso', 'completada');

-- Create weekly_production_plans table
CREATE TABLE IF NOT EXISTS weekly_production_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure week_start_date is always a Monday and week_end_date is always a Sunday
  CONSTRAINT check_week_start_monday CHECK (EXTRACT(DOW FROM week_start_date) = 1),
  CONSTRAINT check_week_end_sunday CHECK (EXTRACT(DOW FROM week_end_date) = 0),
  CONSTRAINT check_week_duration CHECK (week_end_date = week_start_date + INTERVAL '6 days'),
  
  -- Unique constraint to prevent duplicate plans for the same week
  UNIQUE(week_start_date)
);

-- Create weekly_production_tasks table
CREATE TABLE IF NOT EXISTS weekly_production_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES weekly_production_plans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7), -- 1=Monday, 7=Sunday
  task_description TEXT NOT NULL,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL, -- Optional recipe association
  estimated_time_minutes INTEGER CHECK (estimated_time_minutes >= 0),
  status task_status_enum NOT NULL DEFAULT 'pendiente',
  completed_at TIMESTAMP WITH TIME ZONE,
  order_position INTEGER NOT NULL DEFAULT 0, -- For ordering tasks within the same day
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Update completed_at when status changes to 'completada'
  CONSTRAINT check_completed_at CHECK (
    (status = 'completada' AND completed_at IS NOT NULL) OR
    (status != 'completada' AND completed_at IS NULL)
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_weekly_plans_week_start ON weekly_production_plans(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_week_range ON weekly_production_plans(week_start_date, week_end_date);
CREATE INDEX IF NOT EXISTS idx_weekly_tasks_plan_day ON weekly_production_tasks(plan_id, day_of_week, order_position);
CREATE INDEX IF NOT EXISTS idx_weekly_tasks_status ON weekly_production_tasks(status);
CREATE INDEX IF NOT EXISTS idx_weekly_tasks_recipe ON weekly_production_tasks(recipe_id) WHERE recipe_id IS NOT NULL;

-- Create function to automatically set completed_at when status changes
CREATE OR REPLACE FUNCTION update_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is changing to 'completada', set completed_at to now
  IF NEW.status = 'completada' AND OLD.status != 'completada' THEN
    NEW.completed_at := NOW();
  END IF;
  
  -- If status is changing from 'completada' to something else, clear completed_at
  IF NEW.status != 'completada' AND OLD.status = 'completada' THEN
    NEW.completed_at := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update completed_at
CREATE TRIGGER trigger_update_task_completed_at
  BEFORE UPDATE ON weekly_production_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_completed_at();

-- Create function to get weekly plan with tasks
CREATE OR REPLACE FUNCTION get_weekly_plan_with_tasks(week_start_param DATE)
RETURNS JSON AS $$
DECLARE
  plan_record weekly_production_plans%ROWTYPE;
  tasks_result JSON;
  result JSON;
BEGIN
  -- Get the plan for the specified week
  SELECT * INTO plan_record
  FROM weekly_production_plans
  WHERE week_start_date = week_start_param;
  
  -- If no plan exists, return null
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', true,
      'data', NULL,
      'message', 'No hay plan para esta semana'
    );
  END IF;
  
  -- Get tasks for this plan, ordered by day and position
  SELECT json_agg(
    json_build_object(
      'id', t.id,
      'day_of_week', t.day_of_week,
      'task_description', t.task_description,
      'recipe_id', t.recipe_id,
      'recipe_name', r.name,
      'recipe_image_url', r.image_url,
      'estimated_time_minutes', t.estimated_time_minutes,
      'status', t.status,
      'completed_at', t.completed_at,
      'order_position', t.order_position,
      'created_at', t.created_at
    ) ORDER BY t.day_of_week, t.order_position
  ) INTO tasks_result
  FROM weekly_production_tasks t
  LEFT JOIN recipes r ON t.recipe_id = r.id
  WHERE t.plan_id = plan_record.id;
  
  -- Build result
  result := json_build_object(
    'success', true,
    'data', json_build_object(
      'id', plan_record.id,
      'week_start_date', plan_record.week_start_date,
      'week_end_date', plan_record.week_end_date,
      'notes', plan_record.notes,
      'created_at', plan_record.created_at,
      'tasks', COALESCE(tasks_result, '[]'::json)
    ),
    'message', 'Plan semanal obtenido exitosamente'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to duplicate a week plan
CREATE OR REPLACE FUNCTION duplicate_weekly_plan(
  source_week_start DATE,
  target_week_start DATE
) RETURNS JSON AS $$
DECLARE
  source_plan_id UUID;
  new_plan_id UUID;
  task_record weekly_production_tasks%ROWTYPE;
  result JSON;
BEGIN
  -- Validate target week start is a Monday
  IF EXTRACT(DOW FROM target_week_start) != 1 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'La fecha de inicio debe ser un lunes'
    );
  END IF;
  
  -- Check if target week already has a plan
  IF EXISTS(SELECT 1 FROM weekly_production_plans WHERE week_start_date = target_week_start) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Ya existe un plan para esta semana'
    );
  END IF;
  
  -- Get source plan
  SELECT id INTO source_plan_id
  FROM weekly_production_plans
  WHERE week_start_date = source_week_start;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No se encontró el plan fuente'
    );
  END IF;
  
  -- Create new plan
  INSERT INTO weekly_production_plans (week_start_date, week_end_date, notes)
  SELECT target_week_start, target_week_start + INTERVAL '6 days', 
         'Copia del plan de ' || source_week_start::TEXT || ' - ' || notes
  FROM weekly_production_plans
  WHERE id = source_plan_id
  RETURNING id INTO new_plan_id;
  
  -- Copy all tasks
  FOR task_record IN 
    SELECT * FROM weekly_production_tasks 
    WHERE plan_id = source_plan_id
    ORDER BY day_of_week, order_position
  LOOP
    INSERT INTO weekly_production_tasks (
      plan_id, day_of_week, task_description, recipe_id, 
      estimated_time_minutes, order_position
    ) VALUES (
      new_plan_id, task_record.day_of_week, task_record.task_description,
      task_record.recipe_id, task_record.estimated_time_minutes, task_record.order_position
    );
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'new_plan_id', new_plan_id,
      'week_start_date', target_week_start
    ),
    'message', 'Plan duplicado exitosamente'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Error al duplicar plan: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to get weekly plan statistics
CREATE OR REPLACE FUNCTION get_weekly_plan_stats(plan_id_param UUID)
RETURNS JSON AS $$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
  total_time INTEGER;
  completed_time INTEGER;
  tasks_by_day JSON;
  result JSON;
BEGIN
  -- Get basic statistics
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completada'),
    COALESCE(SUM(estimated_time_minutes), 0),
    COALESCE(SUM(estimated_time_minutes) FILTER (WHERE status = 'completada'), 0)
  INTO total_tasks, completed_tasks, total_time, completed_time
  FROM weekly_production_tasks
  WHERE plan_id = plan_id_param;
  
  -- Get tasks grouped by day
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
    FROM weekly_production_tasks
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


