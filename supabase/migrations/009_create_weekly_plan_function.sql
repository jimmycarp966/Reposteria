-- Migration: Create function to safely create weekly plans
-- Date: 2024-12-19
-- Description: Add function to create weekly plans with proper date handling

-- Create function to create weekly plan with proper date calculation
CREATE OR REPLACE FUNCTION create_weekly_plan(
  week_start_param DATE,
  notes_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  new_plan_id UUID;
  week_end_date DATE;
  result JSON;
BEGIN
  -- Validate that week_start_param is a Monday
  IF EXTRACT(DOW FROM week_start_param) != 1 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'La fecha de inicio debe ser un lunes'
    );
  END IF;
  
  -- Check if plan already exists for this week
  IF EXISTS(SELECT 1 FROM weekly_production_plans WHERE week_start_date = week_start_param) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Ya existe un plan para esta semana'
    );
  END IF;
  
  -- Calculate week end date (exactly 6 days after start)
  week_end_date := week_start_param + INTERVAL '6 days';
  
  -- Insert the plan
  INSERT INTO weekly_production_plans (week_start_date, week_end_date, notes)
  VALUES (week_start_param, week_end_date, notes_param)
  RETURNING id INTO new_plan_id;
  
  -- Return success with plan data
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
