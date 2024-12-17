import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protect all routes under /timeline and /profile
  if ((!session && req.nextUrl.pathname.startsWith('/timeline')) ||
      (!session && req.nextUrl.pathname.startsWith('/profile'))) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/auth';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ['/timeline/:path*', '/profile/:path*'],
};