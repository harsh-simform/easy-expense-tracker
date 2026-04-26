import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listCategories } from "@/lib/queries";
import { CategoriesProvider } from "@/components/categories-provider";
import { DesktopSidebar, MobileBottomNav } from "@/components/nav";
import { SignOutMenu } from "@/components/sign-out-menu";
import { AddExpenseFab } from "@/components/add-expense-fab";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const allowedEmail = process.env.ALLOWED_EMAIL;
  if (!user || (allowedEmail && user.email !== allowedEmail)) {
    redirect("/sign-in");
  }

  const categories = await listCategories();

  return (
    <CategoriesProvider categories={categories}>
      <div className="flex min-h-dvh">
        <DesktopSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur md:px-6">
            <div className="text-sm font-medium md:hidden">
              <span className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-semibold">
                  ₹
                </span>
                Expenses
              </span>
            </div>
            <div className="ml-auto">
              <SignOutMenu email={user.email ?? ""} />
            </div>
          </header>
          <main className="flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-8">{children}</main>
        </div>
        <MobileBottomNav />
        <AddExpenseFab />
      </div>
    </CategoriesProvider>
  );
}
