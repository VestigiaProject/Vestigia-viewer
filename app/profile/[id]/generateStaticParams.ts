import { createClient } from '@supabase/supabase-js';

export async function generateStaticParams() {
  // Create a Supabase client using environment variables
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch all historical figure IDs
  const { data: figures } = await supabase
    .from('historical_figures')
    .select('id');

  // Return an array of params objects
  return figures?.map((figure) => ({
    id: figure.id.toString(),
  })) || [];
} 