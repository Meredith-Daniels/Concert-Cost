import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
}

function redirectWithCookies(
  request: NextRequest,
  pathname: string,
  supabaseResponse: NextResponse
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const redirect = NextResponse.redirect(url);
  copyCookies(supabaseResponse, redirect);
  return redirect;
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/add") ||
    pathname.startsWith("/concerts") ||
    pathname.startsWith("/nearby") ||
    pathname.startsWith("/liked") ||
    pathname.startsWith("/recommended");

  if (!user && isProtectedRoute) {
    return redirectWithCookies(request, "/login", supabaseResponse);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    return redirectWithCookies(request, "/dashboard", supabaseResponse);
  }

  if (user && pathname === "/") {
    return redirectWithCookies(request, "/dashboard", supabaseResponse);
  }

  if (!user && pathname === "/") {
    return redirectWithCookies(request, "/login", supabaseResponse);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
