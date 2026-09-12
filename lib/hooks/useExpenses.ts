'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Expense, PaymentMethod } from '@/lib/types';

export interface CreateExpensePayload {
  amount: number;
  category_id: string;
  source_id?: string | null;
  payment_method: PaymentMethod;
  date: string;
  note?: string | null;
  receipt_url?: string | null;
  receipt_public_id?: string | null;
}

export function useExpenses() {
  const supabase = createClient();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('expenses')
      .select('*, category:categories(*), source:sources(*)')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setExpenses((data as Expense[]) ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const createExpense = async (payload: CreateExpensePayload): Promise<Expense | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        amount: payload.amount,
        category_id: payload.category_id,
        source_id: payload.source_id || null,
        payment_method: payload.payment_method,
        date: payload.date,
        note: payload.note || null,
        receipt_url: payload.receipt_url || null,
        receipt_public_id: payload.receipt_public_id || null,
      })
      .select('*, category:categories(*), source:sources(*)')
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    setExpenses(prev => [data as Expense, ...prev]);
    return data as Expense;
  };

  const updateExpense = async (
    id: string,
    updates: Partial<CreateExpensePayload>
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('expenses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      setError(error.message);
      return false;
    }

    await fetchExpenses();
    return true;
  };

  const deleteExpense = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);

    if (error) {
      setError(error.message);
      return false;
    }

    setExpenses(prev => prev.filter(e => e.id !== id));
    return true;
  };

  return {
    expenses,
    loading,
    error,
    refetch: fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}
