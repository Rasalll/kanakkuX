import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const searchParams = requestUrl.searchParams;
    const code = searchParams.get('code');
    const next = searchParams.get('next') || '/dashboard';
    const errorParam = searchParams.get('error_description') || searchParams.get('error');

    // Resolve the public client-facing origin cleanly
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const host = forwardedHost || request.headers.get('host') || requestUrl.host;
    const proto = forwardedProto || (requestUrl.protocol.startsWith('https') ? 'https' : 'http');

    // Never redirect to 0.0.0.0 which causes blank / unreachable browser pages on Windows and mobile
    const cleanHost = host.replace(/^0\.0\.0\.0/, 'localhost');
    const origin = `${proto}://${cleanHost}`;

    // If Google/OAuth provider returned an error parameter
    if (errorParam) {
      console.error('[OAuth Callback] Provider returned error:', errorParam);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(errorParam)}`
      );
    }

    if (code) {
      const cookieStore = await cookies();

      // Ensure redirect destination is a safe relative path
      const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
      const redirectUrl = `${origin}${safeNext}`;
      const response = NextResponse.redirect(redirectUrl);

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                try {
                  cookieStore.set(name, value, options);
                } catch {
                  // Ignore if cookieStore cannot be updated in this context
                }
                try {
                  response.cookies.set(name, value, options);
                } catch {
                  // Ignore
                }
              });
            },
          },
        }
      );

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('[OAuth Callback] Error exchanging code for session:', exchangeError.message);
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
        );
      }

      if (data?.session) {
        return response;
      }
    }

    // No code and no error parameter provided
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('No authorization code received from provider')}`
    );
  } catch (err: any) {
    console.error('[OAuth Callback] Unexpected fatal error in callback route:', err);
    // Safe fallback to prevent blank pages
    return NextResponse.redirect(
      `http://localhost:3000/login?error=${encodeURIComponent(err?.message || 'Authentication error')}`
    );
  }
}
