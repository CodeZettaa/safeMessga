'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { categoryIconNames } from '@/lib/config';
import { categoryLabel } from '@/lib/i18n/locale';
import { upsertCategory } from '@/app/actions/admin';
import { useI18n } from '@/components/i18n-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { Category } from '@/types/database';

export function CategoryManager({ categories }: { categories: Category[] }) {
  const { locale, messages } = useI18n();
  const copy = messages.admin;
  const [editing, setEditing] = useState<Partial<Category>>({
    key: '',
    name_ar: '',
    name_en: '',
    icon: 'message-circle',
    color: '#5B3A8C',
    sort_order: (categories.at(-1)?.sort_order ?? 0) + 10,
    is_active: true,
  });

  async function save() {
    try {
      await upsertCategory({
        id: editing.id,
        key: editing.key ?? '',
        nameAr: editing.name_ar ?? '',
        nameEn: editing.name_en ?? undefined,
        icon: editing.icon ?? 'message-circle',
        color: editing.color ?? '#5B3A8C',
        sortOrder: Number(editing.sort_order ?? 0),
        isActive: Boolean(editing.is_active),
      });
      toast.success(copy.categorySaved);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.actionError);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-3">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className="flex w-full items-center justify-between rounded-2xl border bg-card p-4 text-start"
            onClick={() => setEditing(category)}
          >
            <span>
              {categoryLabel(category, locale)}
              <span className="block text-xs text-muted-foreground">{category.key}</span>
            </span>
            <span className="size-4 rounded-full" style={{ background: category.color }} />
          </button>
        ))}
      </div>
      <form
        className="space-y-3 rounded-3xl border bg-card p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <h2 className="font-bold">{editing.id ? copy.editCategory : copy.newCategory}</h2>
        <div className="space-y-2">
          <Label>{copy.englishKey}</Label>
          <Input
            value={editing.key ?? ''}
            onChange={(event) => setEditing((current) => ({ ...current, key: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>{copy.nameArabic}</Label>
          <Input
            value={editing.name_ar ?? ''}
            onChange={(event) => setEditing((current) => ({ ...current, name_ar: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>{copy.nameEnglish}</Label>
          <Input
            value={editing.name_en ?? ''}
            onChange={(event) => setEditing((current) => ({ ...current, name_en: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>{copy.icon}</Label>
          <select
            className="h-9 w-full rounded-lg border bg-background px-2 text-sm"
            value={editing.icon}
            onChange={(event) => setEditing((current) => ({ ...current, icon: event.target.value }))}
          >
            {categoryIconNames.map((icon) => (
              <option key={icon} value={icon}>
                {icon}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>{copy.color}</Label>
          <Input
            type="color"
            value={editing.color ?? '#5B3A8C'}
            onChange={(event) => setEditing((current) => ({ ...current, color: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>{copy.sortOrder}</Label>
          <Input
            type="number"
            value={editing.sort_order ?? 0}
            onChange={(event) =>
              setEditing((current) => ({ ...current, sort_order: Number(event.target.value) }))
            }
          />
        </div>
        <label className="flex items-center justify-between text-sm">
          {copy.active}
          <Switch
            checked={Boolean(editing.is_active)}
            onCheckedChange={(checked) => setEditing((current) => ({ ...current, is_active: checked }))}
          />
        </label>
        <Button type="submit" className="w-full">
          {messages.common.save}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() =>
            setEditing({
              key: '',
              name_ar: '',
              name_en: '',
              icon: 'message-circle',
              color: '#5B3A8C',
              sort_order: (categories.at(-1)?.sort_order ?? 0) + 10,
              is_active: true,
            })
          }
        >
          {copy.newCategory}
        </Button>
      </form>
    </div>
  );
}
