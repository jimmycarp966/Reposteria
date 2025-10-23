-- Function to check stock availability for all tasks in a weekly plan
CREATE OR REPLACE FUNCTION public.check_stock_for_plan(
    plan_id_param uuid
)
RETURNS TABLE (
    ingredient_id uuid,
    ingredient_name character varying,
    required_quantity numeric,
    available_quantity numeric,
    shortage numeric,
    unit character varying
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH required_ingredients AS (
        -- Calculate total required quantity for each ingredient in the plan
        -- We assume each task is for one batch of the recipe
        SELECT
            ri.ingredient_id,
            SUM(ri.quantity) AS total_required
        FROM weekly_production_tasks wpt
        JOIN recipes r ON wpt.recipe_id = r.id
        JOIN recipe_ingredients ri ON r.id = ri.recipe_id
        WHERE wpt.plan_id = plan_id_param
          AND wpt.recipe_id IS NOT NULL
        GROUP BY ri.ingredient_id
    )
    -- Compare required quantities with available inventory
    SELECT
        req.ingredient_id,
        i.name AS ingredient_name,
        req.total_required AS required_quantity,
        COALESCE(inv.quantity, 0) AS available_quantity,
        (req.total_required - COALESCE(inv.quantity, 0)) AS shortage,
        i.unit
    FROM required_ingredients req
    JOIN ingredients i ON req.ingredient_id = i.id
    LEFT JOIN inventory inv ON req.ingredient_id = inv.ingredient_id
    WHERE req.total_required > COALESCE(inv.quantity, 0);
END;
$$;
