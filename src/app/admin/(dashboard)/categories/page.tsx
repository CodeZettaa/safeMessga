import { listAllCategories } from '@/lib/queries/categories';
import { CategoryManager } from '@/components/admin/category-manager';
import { getMessages } from '@/lib/i18n';

export default async function CategoriesPage() {
  const [{ messages }, categories] = await Promise.all([getMessages(), listAllCategories()]);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{messages.admin.categories}</h1>
      <CategoryManager categories={categories} />
    </div>
  );
}
