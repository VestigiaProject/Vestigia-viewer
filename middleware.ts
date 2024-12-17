import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Allow access to static files and API routes
  if (
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/api')
  ) {
    return res;
  }

  // Protect all routes except public ones
  if (!session && !req.nextUrl.pathname.startsWith('/auth')) {
    const redirectUrl = new URL('/auth', process.env.NEXT_PUBLIC_SITE_URL);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to timeline if already authenticated
  if (session && req.nextUrl.pathname === '/auth') {
    const redirectUrl = new URL('/timeline', process.env.NEXT_PUBLIC_SITE_URL);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};