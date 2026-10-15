import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/?error=oauth", request.url));
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/?error=oauth", request.url));
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.provider !== "google") return NextResponse.redirect(new URL("/", request.url));
  const { data } = await supabase.from("profiles").select("is_superadmin").eq("id", user.id).maybeSingle();
  return NextResponse.redirect(new URL(data?.is_superadmin ? "/admin" : "/denied", request.url));
}

