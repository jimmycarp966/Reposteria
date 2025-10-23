-- Migration: Fix week duration constraint
-- Date: 2024-12-19
-- Description: Make week duration constraint more flexible

-- Drop the existing constraint
ALTER TABLE weekly_production_plans DROP CONSTRAINT IF EXISTS check_week_duration;

-- Add a more flexible constraint that allows for timezone differences
ALTER TABLE weekly_production_plans ADD CONSTRAINT check_week_duration 
CHECK (week_end_date >= week_start_date + INTERVAL '5 days' AND 
       week_end_date <= week_start_date + INTERVAL '7 days');
