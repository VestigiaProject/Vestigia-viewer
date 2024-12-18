-- Add checkmark column to historical_figures table
ALTER TABLE historical_figures ADD COLUMN checkmark BOOLEAN DEFAULT false;

-- Enable realtime for this column
ALTER PUBLICATION supabase_realtime SET TABLE historical_figures; 