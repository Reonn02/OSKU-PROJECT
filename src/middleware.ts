import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Admin Route Protection
    if (pathname.startsWith('/admin')) {
        // Allow access to login page
        if (pathname === '/admin/login') {
            // Optional: Redirect to dashboard if already logged in
            if (request.cookies.has('admin_session')) {
                return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            }
            return NextResponse.next();
        }

        // Protect other admin routes
        if (!request.cookies.has('admin_session')) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    // 2. Petugas Route Protection
    if (pathname.startsWith('/petugas')) {
        // Allow access to login page
        if (pathname === '/petugas/login') {
            // Optional: Redirect to dashboard if already logged in
            if (request.cookies.has('petugas_session')) {
                return NextResponse.redirect(new URL('/petugas/dashboard', request.url));
            }
            return NextResponse.next();
        }

        // Protect other petugas routes
        if (!request.cookies.has('petugas_session')) {
            return NextResponse.redirect(new URL('/petugas/login', request.url));
        }
    }

    // 3. Nasabah (Dashboard) Route Protection
    // Disabled temporarily as Nasabah uses client-side auth (localStorage) which Middleware cannot see.
    // relying on component-level AuthGuard for now.
    /*
    if (pathname.startsWith('/dashboard')) {
        // Check for Supabase Auth Cookie
        // Supabase cookies usually look like: sb-<project-ref>-auth-token
        const hasSupabaseCookie = request.cookies.getAll().some(cookie =>
            cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
        );

        if (!hasSupabaseCookie) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }
    */

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
