// middleware.js (root level) - FIXED FOR EDGE RUNTIME
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  console.log('Middleware checking:', pathname);

  // Skip middleware for these paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/signin' ||
    pathname === '/register' ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp)$/)
  ) {
    return NextResponse.next();
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      console.log('No token found, redirecting to signin');
      const url = new URL('/signin', request.url);
      url.searchParams.set('message', 'Please sign in to continue');
      return NextResponse.redirect(url);
    }

    try {
      // Use jose for Edge Runtime compatibility
      await jwtVerify(token, JWT_SECRET);
      console.log('Token verified successfully');
      return NextResponse.next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      const url = new URL('/signin', request.url);
      url.searchParams.set('message', 'Session expired, please sign in again');
      
      const response = NextResponse.redirect(url);
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and API routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};