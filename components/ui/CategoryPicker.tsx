'use client';

import { cn } from '@/lib/utils';
import { Category } from '@/lib/types';
import * as LucideIcons from 'lucide-react';
import { LucideProps } from 'lucide-react';
import { ElementType } from 'react';

interface CategoryPickerProps {
  categories: Category[];
  value: string | null; // category_id
  onChange: (id: string) => void;
  className?: string;
}

// Safely render a Lucide icon by string name
function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = (LucideIcons as unknown as Record<string, ElementType>)[name];
  if (!Icon) return <LucideIcons.Tag {...props} />;
  return <Icon {...props} />;
}

export function CategoryPicker({
  categories,
  value,
  onChange,
  className,
}: CategoryPickerProps) {
  return (
    <div className={cn('grid grid-cols-4 gap-2 sm:grid-cols-5', className)}>
      {categories.map((cat) => {
        const isSelected = value === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            id={`cat-${cat.id}`}
            onClick={() => onChange(cat.id)}
            title={cat.name}
            className={cn(
              'flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all text-center',
              isSelected
                ? 'border-primary bg-primary/15 shadow-sm shadow-primary/20'
                : 'border-border bg-surface-2 hover:border-border-light hover:bg-surface-3'
            )}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${cat.color}20` }}
            >
              <DynamicIcon
                name={cat.icon}
                className="w-4 h-4"
                style={{ color: cat.color }}
              />
            </div>
            <span
              className={cn(
                'text-[10px] font-medium leading-tight truncate w-full',
                isSelected ? 'text-primary-light' : 'text-tx-2'
              )}
            >
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
