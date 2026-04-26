import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const allowedEmail = process.env.ALLOWED_EMAIL;
  if (user && (!allowedEmail || user.email === allowedEmail)) {
    redirect("/dashboard");
  }
  redirect("/sign-in");
}
