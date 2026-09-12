'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Category } from '@/lib/types';

export function useCategories() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${user?.id}`)
      .order('name', { ascending: true });

    if (error) setError(error.message);
    else setCategories(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (
    name: string,
    icon: string,
    color: string
  ): Promise<Category | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('categories')
      .insert({ user_id: user.id, name: name.trim(), icon, color })
      .select()
      .single();

    if (error) { setError(error.message); return null; }
    await fetchCategories();
    return data;
  };

  const updateCategory = async (
    id: string,
    updates: Partial<Pick<Category, 'name' | 'icon' | 'color'>>
  ) => {
    const { error } = await supabase
      .from('categories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) setError(error.message);
    else await fetchCategories();
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) setError(error.message);
    else await fetchCategories();
  };

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
