import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/sign-in?error=oauth_failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const allowedEmail = process.env.ALLOWED_EMAIL;
  if (!user || (allowedEmail && user.email !== allowedEmail)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/sign-in?error=forbidden`);
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
