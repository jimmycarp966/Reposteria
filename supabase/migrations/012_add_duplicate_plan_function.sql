-- Function to duplicate a weekly plan and its tasks to a new week
CREATE OR REPLACE FUNCTION public.duplicate_weekly_plan(
    source_week_start_param date,
    target_week_start_param date
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    source_plan_id uuid;
    new_plan_id uuid;
    target_week_end_param date;
    new_plan_record weekly_production_plans;
BEGIN
    -- 1. Check if a plan already exists for the target week
    IF EXISTS (SELECT 1 FROM weekly_production_plans WHERE week_start_date = target_week_start_param) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Ya existe un plan para la semana de destino.'
        );
    END IF;

    -- 2. Find the source plan
    SELECT id INTO source_plan_id
    FROM weekly_production_plans
    WHERE week_start_date = source_week_start_param;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'No se encontró el plan de origen para duplicar.'
        );
    END IF;

    -- 3. Calculate target week's end date (Sunday)
    target_week_end_param := target_week_start_param + interval '6 days';

    -- 4. Create the new weekly plan
    INSERT INTO weekly_production_plans (week_start_date, week_end_date, notes)
    SELECT target_week_start_param, target_week_end_param, 'Copia de la semana ' || to_char(source_week_start_param, 'DD/MM/YYYY')
    FROM weekly_production_plans
    WHERE id = source_plan_id
    RETURNING * INTO new_plan_record;
    
    new_plan_id := new_plan_record.id;

    -- 5. Copy all tasks from the source plan to the new plan
    INSERT INTO weekly_production_tasks (
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
        'pendiente' AS status, -- Reset status to pending
        wpt.order_position,
        wpt.category_id
    FROM weekly_production_tasks wpt
    WHERE wpt.plan_id = source_plan_id;

    -- 6. Return success with the new plan's data
    RETURN json_build_object(
        'success', true,
        'message', 'Plan semanal duplicado exitosamente.',
        'data', row_to_json(new_plan_record)
    );
END;
$$;
