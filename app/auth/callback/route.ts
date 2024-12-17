import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Exchange the code for a session
    const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (session) {
      // Check if user profile exists
      const { data: profile } = await supabase
        .from('user_profiles')
        .select()
        .eq('id', session.user.id)
        .single();

      // If profile doesn't exist, create it
      if (!profile) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: session.user.id,
            username: session.user.email?.split('@')[0] || `user_${session.user.id.slice(0, 8)}`,
            start_date: new Date('1789-06-01').toISOString()
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
        }
      }
    }
  }

  // Redirect to the timeline page
  return NextResponse.redirect(new URL('/timeline', request.url));
}