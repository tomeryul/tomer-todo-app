-- Add position column for task ordering
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;

-- Create index for faster ordering
CREATE INDEX IF NOT EXISTS idx_tasks_position ON public.tasks(date, position);