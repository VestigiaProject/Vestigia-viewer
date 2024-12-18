-- Enable realtime for historical_posts table
alter publication supabase_realtime add table historical_posts;

-- Add policy to allow realtime select
CREATE POLICY "Enable read access for all users" ON "public"."historical_posts"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

-- Enable RLS
ALTER TABLE "public"."historical_posts" ENABLE ROW LEVEL SECURITY; 