'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Income, PaymentMethod } from '@/lib/types';

export interface CreateIncomePayload {
  amount: number;
  source_id?: string | null;
  payment_method: PaymentMethod;
  date: string;
  note?: string | null;
}

export function useIncome() {
  const supabase = createClient();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncomes = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIncomes([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('income')
      .select('*, source:sources(*)')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setIncomes((data as Income[]) ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  const createIncome = async (payload: CreateIncomePayload): Promise<Income | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('income')
      .insert({
        user_id: user.id,
        amount: payload.amount,
        source_id: payload.source_id || null,
        payment_method: payload.payment_method,
        date: payload.date,
        note: payload.note || null,
      })
      .select('*, source:sources(*)')
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    setIncomes(prev => [data as Income, ...prev]);
    return data as Income;
  };

  const updateIncome = async (
    id: string,
    updates: Partial<CreateIncomePayload>
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('income')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      setError(error.message);
      return false;
    }

    await fetchIncomes();
    return true;
  };

  const deleteIncome = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('income').delete().eq('id', id);

    if (error) {
      setError(error.message);
      return false;
    }

    setIncomes(prev => prev.filter(i => i.id !== id));
    return true;
  };

  return {
    incomes,
    loading,
    error,
    refetch: fetchIncomes,
    createIncome,
    updateIncome,
    deleteIncome,
  };
}
