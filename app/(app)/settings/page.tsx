import { CategoriesManager } from "@/components/categories-manager";
import { listCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const categories = await listCategories();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage categories and the keywords used to auto-detect them.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Categories</h2>
        <CategoriesManager categories={categories} />
      </section>
    </div>
  );
}
