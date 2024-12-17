import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  // Redirect unauthenticated users to auth page
  if (!session && req.nextUrl.pathname.startsWith('/timeline')) {
    return NextResponse.redirect(new URL('/auth', req.url));
  }

  // Redirect authenticated users away from auth page
  if (session && req.nextUrl.pathname === '/auth') {
    return NextResponse.redirect(new URL('/timeline', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/timeline/:path*', '/profile/:path*', '/auth', '/search/:path*'],
};