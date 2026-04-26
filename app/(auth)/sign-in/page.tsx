import Link from "next/link";
import { SignInButton } from "./sign-in-button";

type SearchParams = Promise<{ error?: string }>;

export default async function SignInPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error } = await searchParams;
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="text-xl font-semibold">₹</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Easy Expense Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with your GitHub account to continue.
          </p>
        </div>

        {error === "forbidden" && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-left text-sm text-destructive">
            That GitHub account isn’t allowed. This app is for personal use only.
          </div>
        )}

        <SignInButton />

        <p className="text-xs text-muted-foreground">
          By continuing you agree to{" "}
          <Link href="#" className="underline">
            personal use only
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
