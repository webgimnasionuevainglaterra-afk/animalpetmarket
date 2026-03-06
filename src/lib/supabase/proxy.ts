import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      return NextResponse.next({ request });
    }

    let supabaseResponse = NextResponse.next({
      request,
    });

    const supabase = createServerClient(
      url,
      key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
    );

    let user: unknown = null;
    let claimsOk = false;
    const TIMEOUT_MS = 5000;
    try {
      const { data } = await Promise.race([
        supabase.auth.getUser(),
        new Promise<{ data: { user?: unknown } }>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)
        ),
      ]);
      user = data?.user;
      claimsOk = true;
    } catch {
      // Si Supabase falla o hace timeout, NO redirigir para evitar bucles
    }

    const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");

    // Proteger dashboard: sin usuario confirmado -> redirigir a login
    if (isDashboard && claimsOk && !user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      return NextResponse.redirect(redirectUrl);
    }

    return supabaseResponse;
  } catch {
    return NextResponse.next({ request });
  }
}
