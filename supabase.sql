-- Add avatar_url column to user_profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- Update the handle_new_user function to include avatar_url
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'username'),
      SPLIT_PART(NEW.email, '@', 1),
      'user_' || SUBSTRING(NEW.id::text, 1, 8)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Create function to handle avatar updates
CREATE OR REPLACE FUNCTION public.handle_storage_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  file_user_id uuid;
  public_url text;
BEGIN
  -- Extract user_id from the file name (assuming format: user_id-timestamp.ext)
  file_user_id := (regexp_match(NEW.name, '^([0-9a-f-]+)-'))[1]::uuid;
  
  -- Construct the full public URL for the uploaded file using the hardcoded Supabase URL
  public_url := 'https://ocubfcrajgjmdzymcwbu.supabase.co/storage/v1/object/public/' || NEW.bucket_id || '/' || NEW.name;

  -- Update the user_profiles table with the new avatar_url
  UPDATE public.user_profiles
  SET avatar_url = public_url
  WHERE id = file_user_id;

  RETURN NEW;
END;
$$;

-- Create trigger for avatar updates
DROP TRIGGER IF EXISTS on_avatar_updated ON storage.objects;
CREATE TRIGGER on_avatar_updated
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'avatars')
  EXECUTE FUNCTION public.handle_storage_update();

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Create new policies
CREATE POLICY "Users can view all profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Storage policies for avatars bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;