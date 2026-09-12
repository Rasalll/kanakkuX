'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Source } from '@/lib/types';

export function useSources() {
  const supabase = createClient();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .eq('is_archived', false)
      .order('name', { ascending: true });

    if (error) setError(error.message);
    else setSources(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const createSource = async (name: string): Promise<Source | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('sources')
      .upsert(
        { user_id: user.id, name: name.trim(), is_archived: false },
        { onConflict: 'user_id,name' }
      )
      .select()
      .single();

    if (error) { setError(error.message); return null; }
    await fetchSources();
    return data;
  };

  const renameSource = async (id: string, name: string) => {
    const { error } = await supabase
      .from('sources')
      .update({ name: name.trim(), updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) setError(error.message);
    else await fetchSources();
  };

  const archiveSource = async (id: string) => {
    const { error } = await supabase
      .from('sources')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) setError(error.message);
    else await fetchSources();
  };

  const unarchiveSource = async (id: string) => {
    const { error } = await supabase
      .from('sources')
      .update({ is_archived: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) setError(error.message);
    else await fetchSources();
  };

  return {
    sources,
    loading,
    error,
    refetch: fetchSources,
    createSource,
    renameSource,
    archiveSource,
    unarchiveSource,
  };
}
