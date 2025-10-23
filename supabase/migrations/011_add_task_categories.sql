-- 1. Create task_categories table
CREATE TABLE IF NOT EXISTS public.task_categories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name character varying(255) NOT NULL,
    color character varying(7) NOT NULL DEFAULT '#808080',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT task_categories_pkey PRIMARY KEY (id),
    CONSTRAINT task_categories_name_key UNIQUE (name)
);

-- 2. Enable RLS and define policies for task_categories
ALTER TABLE public.task_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for authenticated users" ON public.task_categories FOR ALL USING (true) WITH CHECK (true);

-- 3. Add category_id to weekly_production_tasks table
ALTER TABLE public.weekly_production_tasks
ADD COLUMN IF NOT EXISTS category_id uuid NULL;

-- 4. Add foreign key constraint
ALTER TABLE public.weekly_production_tasks
ADD CONSTRAINT weekly_production_tasks_category_id_fkey FOREIGN KEY (category_id)
REFERENCES public.task_categories(id) ON DELETE SET NULL;

-- 5. Add a few default categories
INSERT INTO public.task_categories (name, color)
VALUES
    ('Preparación de Masas', '#FFC8DD'), -- Pastel Pink
    ('Horneado', '#FFD700'),             -- Gold
    ('Decoración', '#A2D2FF'),          -- Baby Blue
    ('Limpieza', '#C0C0C0'),              -- Silver
    ('Empaquetado', '#BDE0FE'),          -- Light Blue
    ('Compras', '#A8D8B9')               -- Celadon
ON CONFLICT (name) DO NOTHING;

-- 6. Add category_id to rpc get_weekly_plan_with_tasks
CREATE OR REPLACE FUNCTION public.get_weekly_plan_with_tasks(week_start_param date)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
    plan_record weekly_production_plans;
    tasks_json json;
    result_json json;
BEGIN
    -- Find the plan for the given week start date
    SELECT *
    INTO plan_record
    FROM weekly_production_plans
    WHERE week_start_date = week_start_param;

    -- If no plan is found, return a success message with null data
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'No hay plan para esta semana',
            'data', null
        );
    END IF;

    -- Aggregate tasks for the found plan, including category info
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
    FROM weekly_production_tasks wpt
    LEFT JOIN recipes r ON wpt.recipe_id = r.id
    LEFT JOIN task_categories tc ON wpt.category_id = tc.id
    WHERE wpt.plan_id = plan_record.id;

    -- Build the final result object
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
$function$;
