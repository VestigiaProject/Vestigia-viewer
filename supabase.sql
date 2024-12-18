-- Add source column to historical_posts if it doesn't exist
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