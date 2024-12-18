-- Enable RLS for historical_figures table (if not already enabled)
ALTER TABLE "public"."historical_figures" ENABLE ROW LEVEL SECURITY;

-- Add policy to allow public read access to historical figures
CREATE POLICY "Enable read access for all users" ON "public"."historical_figures"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

-- Enable realtime for historical_figures table
alter publication supabase_realtime add table historical_figures;

-- Enable realtime replication for the table
ALTER TABLE historical_figures REPLICA IDENTITY FULL;