-- Create translations table
CREATE TABLE post_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES historical_posts(id),
    language VARCHAR(2) NOT NULL,
    content TEXT NOT NULL,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(post_id, language)
);

-- Add policy to allow public read access to translations
CREATE POLICY "Enable read access for all users" ON "public"."post_translations"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

-- Enable RLS
ALTER TABLE post_translations ENABLE ROW LEVEL SECURITY;

-- Add language column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN preferred_language VARCHAR(2) DEFAULT 'fr';