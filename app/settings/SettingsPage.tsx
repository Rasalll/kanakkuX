'use client';

import { useState } from 'react';
import {
  Plus, Pencil, Archive, ArchiveRestore, Trash2,
  Tag, Wallet, User, LogOut, ChevronRight, Loader2, Check, X,
} from 'lucide-react';
import { useSources } from '@/lib/hooks/useSources';
import { useCategories } from '@/lib/hooks/useCategories';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { LucideProps } from 'lucide-react';
import { ElementType } from 'react';

// ─── Icon renderer ────────────────────────────────────────────────────────────
function DynIcon({ name, ...p }: { name: string } & LucideProps) {
  const Icon = (LucideIcons as unknown as Record<string, ElementType>)[name];
  if (!Icon) return <LucideIcons.Tag {...p} />;
  return <Icon {...p} />;
}

// Available category icon options
const ICON_OPTIONS = [
  'Utensils', 'Car', 'ShoppingBag', 'Receipt', 'Film', 'HeartPulse',
  'GraduationCap', 'Plane', 'CreditCard', 'MoreHorizontal', 'Home',
  'Gamepad2', 'Coffee', 'Dumbbell', 'Music', 'BookOpen', 'Gift',
  'Briefcase', 'Wifi', 'Smartphone',
];

const COLOR_OPTIONS = [
  '#EF4444', '#F97316', '#F59E0B', '#22C55E', '#14B8A6',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#6B7280',
];

export default function SettingsPage() {
  const supabase = createClient();
  const {
    sources, loading: srcLoading, createSource, renameSource,
    archiveSource, unarchiveSource,
  } = useSources();
  const {
    categories, loading: catLoading, createCategory,
    updateCategory, deleteCategory,
  } = useCategories();

  // ── Source state ─────────────────────────────────────────────────────────
  const [newSrcName, setNewSrcName] = useState('');
  const [editSrcId, setEditSrcId] = useState<string | null>(null);
  const [editSrcName, setEditSrcName] = useState('');
  const [srcSaving, setSrcSaving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // ── Category state ────────────────────────────────────────────────────────
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', icon: 'Tag', color: '#6366F1' });
  const [catSaving, setCatSaving] = useState(false);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [deleteCatConfirm, setDeleteCatConfirm] = useState<string | null>(null);

  // ── Auth ─────────────────────────────────────────────────────────────────
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    setLogoutLoading(true);
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // ── Source handlers ───────────────────────────────────────────────────────
  const handleAddSource = async () => {
    if (!newSrcName.trim()) return;
    setSrcSaving(true);
    await createSource(newSrcName.trim());
    setNewSrcName('');
    setSrcSaving(false);
  };

  const handleRenameSource = async (id: string) => {
    if (!editSrcName.trim()) return;
    setSrcSaving(true);
    await renameSource(id, editSrcName.trim());
    setEditSrcId(null);
    setEditSrcName('');
    setSrcSaving(false);
  };

  // ── Category handlers ─────────────────────────────────────────────────────
  const openNewCat = () => {
    setEditCatId(null);
    setCatForm({ name: '', icon: 'Tag', color: '#6366F1' });
    setCatModalOpen(true);
  };

  const openEditCat = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    setEditCatId(id);
    setCatForm({ name: cat.name, icon: cat.icon, color: cat.color });
    setCatModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!catForm.name.trim()) return;
    setCatSaving(true);
    if (editCatId) {
      await updateCategory(editCatId, catForm);
    } else {
      await createCategory(catForm.name.trim(), catForm.icon, catForm.color);
    }
    setCatSaving(false);
    setCatModalOpen(false);
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
    setDeleteCatConfirm(null);
  };

  const activeSources = sources.filter((s) => !s.is_archived);
  const archivedSources = sources.filter((s) => s.is_archived);
  const userCategories = categories.filter((c) => c.user_id !== null);
  const defaultCategories = categories.filter((c) => c.user_id === null);

  return (
    <div className="min-h-dvh bg-bg">
      <div className="max-w-lg mx-auto px-4 py-6 pb-28 space-y-6">
        <h1 className="text-xl font-bold text-tx">Settings</h1>

        {/* ── Money Sources ── */}
        <section className="glass p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary-light" />
              <h2 className="font-semibold text-tx">Money Sources</h2>
            </div>
            <span className="text-xs text-tx-3">{activeSources.length} active</span>
          </div>

          {/* Add new source */}
          <div className="flex gap-2 mb-4">
            <input
              id="new-source-input"
              type="text"
              value={newSrcName}
              onChange={(e) => setNewSrcName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSource()}
              placeholder="Add source (e.g. Salary, Freelance)"
              className="flex-1 px-3 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-primary outline-none text-sm text-tx placeholder-tx-3 transition-all"
            />
            <Button
              id="btn-add-source"
              onClick={handleAddSource}
              loading={srcSaving}
              icon={<Plus className="w-4 h-4" />}
              size="md"
              className="shrink-0"
            >
              Add
            </Button>
          </div>

          {/* Active sources list */}
          {srcLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-tx-3" />
            </div>
          ) : activeSources.length === 0 ? (
            <p className="text-tx-3 text-sm text-center py-3">
              No sources yet. Add your first source above.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {activeSources.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-2 border border-border group"
                >
                  {editSrcId === s.id ? (
                    <>
                      <input
                        autoFocus
                        value={editSrcName}
                        onChange={(e) => setEditSrcName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameSource(s.id)}
                        className="flex-1 bg-transparent text-sm text-tx outline-none"
                      />
                      <button
                        onClick={() => handleRenameSource(s.id)}
                        className="text-green-400 hover:text-green-300 p-0.5"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setEditSrcId(null); setEditSrcName(''); }}
                        className="text-tx-3 hover:text-tx-2 p-0.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-tx font-medium">{s.name}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditSrcId(s.id); setEditSrcName(s.name); }}
                          className="p-1 text-tx-3 hover:text-primary-light rounded transition-colors"
                          title="Rename"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => archiveSource(s.id)}
                          className="p-1 text-tx-3 hover:text-amber-400 rounded transition-colors"
                          title="Archive"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Archived toggle */}
          {archivedSources.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="flex items-center gap-1.5 text-xs text-tx-3 hover:text-tx-2 transition-colors"
              >
                <ChevronRight className={cn('w-3.5 h-3.5 transition-transform', showArchived && 'rotate-90')} />
                {archivedSources.length} archived source{archivedSources.length !== 1 ? 's' : ''}
              </button>
              {showArchived && (
                <ul className="space-y-1 mt-2">
                  {archivedSources.map((s) => (
                    <li key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-2 border border-border opacity-60">
                      <span className="flex-1 text-sm text-tx-3 line-through">{s.name}</span>
                      <button
                        onClick={() => unarchiveSource(s.id)}
                        className="p-1 text-tx-3 hover:text-green-400 rounded transition-colors"
                        title="Restore"
                      >
                        <ArchiveRestore className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        {/* ── Categories ── */}
        <section className="glass p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary-light" />
              <h2 className="font-semibold text-tx">Categories</h2>
            </div>
            <Button
              id="btn-add-category"
              onClick={openNewCat}
              icon={<Plus className="w-4 h-4" />}
              size="sm"
              variant="secondary"
            >
              New
            </Button>
          </div>

          {catLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-tx-3" />
            </div>
          ) : (
            <>
              {/* Default categories (read-only) */}
              <p className="text-[11px] text-tx-3 uppercase tracking-wide font-semibold mb-2">
                Default
              </p>
              <div className="grid grid-cols-2 gap-1.5 mb-4">
                {defaultCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-2 border border-border">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat.color}25` }}
                    >
                      <DynIcon name={cat.icon} className="w-3.5 h-3.5" style={{ color: cat.color }} />
                    </div>
                    <span className="text-sm text-tx-2 truncate">{cat.name}</span>
                  </div>
                ))}
              </div>

              {/* User custom categories */}
              {userCategories.length > 0 && (
                <>
                  <p className="text-[11px] text-tx-3 uppercase tracking-wide font-semibold mb-2">
                    Custom
                  </p>
                  <div className="space-y-1.5">
                    {userCategories.map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-2 border border-border group"
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${cat.color}25` }}
                        >
                          <DynIcon name={cat.icon} className="w-4 h-4" style={{ color: cat.color }} />
                        </div>
                        <span className="flex-1 text-sm text-tx font-medium">{cat.name}</span>

                        {deleteCatConfirm === cat.id ? (
                          <div className="flex gap-1.5 items-center">
                            <span className="text-xs text-tx-3">Delete?</span>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 text-xs font-medium hover:bg-red-500/25"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteCatConfirm(null)}
                              className="px-2 py-0.5 rounded-md bg-surface-3 text-tx-3 text-xs font-medium hover:text-tx"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditCat(cat.id)}
                              className="p-1 text-tx-3 hover:text-primary-light rounded transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteCatConfirm(cat.id)}
                              className="p-1 text-tx-3 hover:text-red-400 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </section>

        {/* ── Account ── */}
        <section className="glass p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-primary-light" />
            <h2 className="font-semibold text-tx">Account</h2>
          </div>
          <Button
            id="btn-logout"
            onClick={handleLogout}
            loading={logoutLoading}
            variant="danger"
            icon={<LogOut className="w-4 h-4" />}
            className="w-full justify-center"
          >
            Sign Out
          </Button>
        </section>
      </div>

      {/* ── Category Form Modal ── */}
      <Modal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={editCatId ? 'Edit Category' : 'New Category'}
      >
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs text-tx-3 uppercase font-semibold tracking-wide mb-1.5">
              Name
            </label>
            <input
              id="cat-name-input"
              autoFocus
              type="text"
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              placeholder="e.g. Groceries"
              className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border focus:border-primary outline-none text-sm text-tx placeholder-tx-3 transition-all"
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-xs text-tx-3 uppercase font-semibold tracking-wide mb-2">
              Icon
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setCatForm({ ...catForm, icon })}
                  className={cn(
                    'flex items-center justify-center w-full aspect-square rounded-xl border transition-all',
                    catForm.icon === icon
                      ? 'border-primary bg-primary/15'
                      : 'border-border bg-surface-2 hover:border-border-light'
                  )}
                >
                  <DynIcon
                    name={icon}
                    className="w-4 h-4"
                    style={{ color: catForm.icon === icon ? catForm.color : undefined }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs text-tx-3 uppercase font-semibold tracking-wide mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCatForm({ ...catForm, color })}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all',
                    catForm.color === color ? 'border-white scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-2 border border-border">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${catForm.color}25` }}
            >
              <DynIcon name={catForm.icon} className="w-5 h-5" style={{ color: catForm.color }} />
            </div>
            <span className="font-medium text-tx text-sm">{catForm.name || 'Preview'}</span>
          </div>

          <Button
            id="btn-save-category"
            onClick={handleSaveCategory}
            loading={catSaving}
            className="w-full justify-center"
            size="lg"
            disabled={!catForm.name.trim()}
          >
            {editCatId ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
