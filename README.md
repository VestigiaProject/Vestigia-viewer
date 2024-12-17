# Historical Social Media Viewer

A unique social media experience that lets users explore historical events through a Twitter-like interface, starting from June 1st, 1789.

## Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project at [https://supabase.com](https://supabase.com)

2. Set up the database tables using the following SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create HistoricalFigures table
CREATE TABLE historical_figures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    title TEXT,
    biography TEXT,
    profile_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create HistoricalPosts table
CREATE TABLE historical_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    figure_id UUID REFERENCES historical_figures(id),
    original_date DATE NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT,
    is_significant BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Users table (managed by Supabase Auth, only storing additional info)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT '1789-06-01 00:00:00+00'::TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create UserInteractions table
CREATE TABLE user_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id),
    post_id UUID REFERENCES historical_posts(id),
    type TEXT CHECK (type IN ('comment', 'like')),
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX idx_posts_original_date ON historical_posts(original_date);
CREATE INDEX idx_interactions_post_id ON user_interactions(post_id);
CREATE INDEX idx_interactions_user_id ON user_interactions(user_id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, start_date)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'username'),
      SPLIT_PART(NEW.email, '@', 1),
      'user_' || SUBSTRING(NEW.id::text, 1, 8)
    ),
    '1789-06-01 00:00:00+00'::TIMESTAMP WITH TIME ZONE
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

3. Set up Storage buckets:
   - Create a public bucket named 'profile-images'
   - Create a public bucket named 'post-media'

4. Enable Google Authentication:
   - Go to Supabase Dashboard > Authentication > Providers
   - Enable Google provider
   - Create a Google OAuth application at [Google Cloud Console](https://console.cloud.google.com)
   - Add your authorized domains and callback URLs
   - Copy the Client ID and Client Secret to Supabase

### 2. Environment Variables

Create a `.env.local` file with the following variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### 4. Deployment

1. Create a new site on Netlify
2. Connect your repository
3. Add the environment variables from step 2
4. Deploy!

## Features

- OAuth authentication with Google
- Historical timeline starting from June 1st, 1789
- Like and comment on historical posts
- View historical figure profiles
- Real-time timeline progression
- Mobile responsive design
- Infinite scroll
- Search functionality

## License

MIT