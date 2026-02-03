-- Add tag column to tasks table
ALTER TABLE public.tasks ADD COLUMN tag text DEFAULT NULL;

-- Create index for tag queries
CREATE INDEX idx_tasks_tag ON public.tasks(tag);