import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/timeline/:path*', '/profile/:path*', '/auth', '/search/:path*'],
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session && req.nextUrl.pathname.startsWith('/timeline')) {
    const redirectUrl = new URL('/auth', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (session && req.nextUrl.pathname === '/auth') {
    const redirectUrl = new URL('/timeline', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}