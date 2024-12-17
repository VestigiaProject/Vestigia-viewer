import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    await supabase.auth.exchangeCodeForSession(code);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 400 }
    );
  }
}