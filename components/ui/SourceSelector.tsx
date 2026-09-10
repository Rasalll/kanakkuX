'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Check, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Source } from '@/lib/types';

interface SourceSelectorProps {
  sources: Source[];
  value: string | null;         // source_id
  onChange: (id: string | null, name: string) => void;
  onCreateNew: (name: string) => Promise<Source | null>;
  placeholder?: string;
  className?: string;
}

export function SourceSelector({
  sources,
  value,
  onChange,
  onCreateNew,
  placeholder = 'Select source (optional)',
  className,
}: SourceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = sources.find((s) => s.id === value);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = sources.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  const showCreate =
    query.trim().length > 0 &&
    !sources.some((s) => s.name.toLowerCase() === query.trim().toLowerCase());

  const handleCreate = async () => {
    if (!query.trim()) return;
    setCreating(true);
    const newSource = await onCreateNew(query.trim());
    setCreating(false);
    if (newSource) {
      onChange(newSource.id, newSource.name);
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        id="source-selector-trigger"
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm transition-all',
          'bg-surface-2 border border-border hover:border-border-light text-left',
          open && 'border-primary ring-1 ring-primary/30'
        )}
      >
        <span className={selected ? 'text-tx font-medium' : 'text-tx-3'}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown
          className={cn('w-4 h-4 text-tx-3 transition-transform shrink-0', open && 'rotate-180')}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-surface-2 border border-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-tx-3" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search or type new source…"
                className="w-full pl-8 pr-3 py-2 bg-surface-3 rounded-lg text-sm text-tx placeholder-tx-3 outline-none border border-transparent focus:border-primary/50"
              />
            </div>
          </div>

          {/* Clear option */}
          {value && (
            <button
              type="button"
              onClick={() => { onChange(null, ''); setOpen(false); setQuery(''); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-tx-3 hover:bg-surface-3 transition-colors"
            >
              Clear selection
            </button>
          )}

          {/* Results */}
          <div className="max-h-44 overflow-y-auto">
            {filtered.length === 0 && !showCreate && (
              <p className="px-3 py-3 text-sm text-tx-3 text-center">No sources found</p>
            )}
            {filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => { onChange(s.id, s.name); setOpen(false); setQuery(''); }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-tx hover:bg-surface-3 transition-colors"
              >
                <span>{s.name}</span>
                {value === s.id && <Check className="w-3.5 h-3.5 text-primary-light shrink-0" />}
              </button>
            ))}
          </div>

          {/* Create new */}
          {showCreate && (
            <div className="border-t border-border p-2">
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-primary-light bg-primary/10 hover:bg-primary/15 transition-colors font-medium"
              >
                {creating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                ) : (
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                )}
                Save &quot;{query.trim()}&quot; as new source
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
