import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const PROTECTED_PREFIXES = ["/chat", "/projects"];

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users away from protected routes
  if (!user && PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const signInUrl = new URL("/auth/sign-in", request.url);
    signInUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect authenticated users away from sign-in page
  if (user && pathname.startsWith("/auth/sign-in")) {
    const projectsUrl = new URL("/projects", request.url);
    return NextResponse.redirect(projectsUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher:
    "/((?!_next/static|_next/image|favicon.ico|share/|auth/callback|api/health|api/cron/).*)",
};
