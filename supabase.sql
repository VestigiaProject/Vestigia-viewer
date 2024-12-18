-- Enable RLS on historical_posts if not already enabled
ALTER TABLE historical_posts ENABLE ROW LEVEL SECURITY;

-- Add source column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'historical_posts' 
        AND column_name = 'source'
    ) THEN
        ALTER TABLE historical_posts ADD COLUMN source TEXT;
    END IF;
END $$;

-- Add policies for historical_posts
DROP POLICY IF EXISTS "Anyone can view historical posts" ON historical_posts;
DROP POLICY IF EXISTS "Only admins can modify historical posts" ON historical_posts;

CREATE POLICY "Anyone can view historical posts"
ON historical_posts FOR SELECT
TO public
USING (true);

-- Add policies for user_interactions if not already present
DROP POLICY IF EXISTS "Users can view all interactions" ON user_interactions;
DROP POLICY IF EXISTS "Users can create their own interactions" ON user_interactions;
DROP POLICY IF EXISTS "Users can delete their own interactions" ON user_interactions;

CREATE POLICY "Users can view all interactions"
ON user_interactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create their own interactions"
ON user_interactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions"
ON user_interactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Enable RLS on user_interactions if not already enabled
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- Create a custom role for managing historical posts
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_roles WHERE rolname = 'historical_posts_admin'
    ) THEN
        CREATE ROLE historical_posts_admin;
    END IF;
END $$;

GRANT ALL ON historical_posts TO historical_posts_admin;

-- Create policy for admin modifications
CREATE POLICY "Admins can modify historical posts"
ON historical_posts 
FOR ALL
TO historical_posts_admin
USING (true)
WITH CHECK (true);

-- Set proper response headers in security definer function
CREATE OR REPLACE FUNCTION public.get_post_with_interactions(post_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (
        SELECT json_build_object(
            'post', p,
            'interactions', (
                SELECT json_build_object(
                    'likes', COUNT(*) FILTER (WHERE type = 'like'),
                    'comments', json_agg(i) FILTER (WHERE type = 'comment')
                )
                FROM user_interactions i
                WHERE i.post_id = p.id
            )
        )
        FROM historical_posts p
        WHERE p.id = post_id
    );
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;