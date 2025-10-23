-- Function to update the order and day of multiple tasks in a single transaction
CREATE OR REPLACE FUNCTION public.update_tasks_order(
    tasks jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    task jsonb;
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
$$;
