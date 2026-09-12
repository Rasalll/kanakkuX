'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Lending, Repayment, LentVia } from '@/lib/types';

export interface CreateLendingPayload {
  person_name: string;
  phone_number?: string | null;
  original_amount: number;
  lent_via: LentVia;
  lent_date: string;
  duration_days?: number | null;
  due_date?: string | null;
  note?: string | null;
}

export interface CreateRepaymentPayload {
  lending_id: string;
  amount: number;
  received_via: LentVia;
  date: string;
  note?: string | null;
}

export function useLending() {
  const supabase = createClient();
  const [lendingList, setLendingList] = useState<Lending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLending = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLendingList([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('lending')
      .select('*, repayments(*)')
      .eq('user_id', user.id)
      .order('lent_date', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      const formatted = (data ?? []).map(row => {
        const reps: Repayment[] = row.repayments ?? [];
        const totalReceived = reps.reduce((sum, r) => sum + Number(r.amount), 0);
        const remaining = Math.max(0, Number(row.original_amount) - totalReceived);
        return {
          ...row,
          amount_received: totalReceived,
          remaining,
        } as Lending;
      });
      setLendingList(formatted);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchLending();
  }, [fetchLending]);

  const createLending = async (payload: CreateLendingPayload): Promise<Lending | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    let dueDate = payload.due_date;
    if (!dueDate && payload.duration_days && payload.lent_date) {
      const d = new Date(payload.lent_date);
      d.setDate(d.getDate() + Number(payload.duration_days));
      dueDate = d.toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('lending')
      .insert({
        user_id: user.id,
        person_name: payload.person_name.trim(),
        phone_number: payload.phone_number || null,
        original_amount: payload.original_amount,
        lent_via: payload.lent_via,
        lent_date: payload.lent_date,
        duration_days: payload.duration_days ?? null,
        due_date: dueDate || null,
        note: payload.note || null,
        status: 'pending',
      })
      .select('*, repayments(*)')
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    const newRecord: Lending = {
      ...data,
      amount_received: 0,
      remaining: Number(data.original_amount),
      repayments: [],
    };

    setLendingList(prev => [newRecord, ...prev]);
    return newRecord;
  };

  const createRepayment = async (payload: CreateRepaymentPayload): Promise<Repayment | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('repayments')
      .insert({
        user_id: user.id,
        lending_id: payload.lending_id,
        amount: payload.amount,
        received_via: payload.received_via,
        date: payload.date,
        note: payload.note || null,
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    await fetchLending();
    return data as Repayment;
  };

  const deleteLending = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('lending').delete().eq('id', id);

    if (error) {
      setError(error.message);
      return false;
    }

    setLendingList(prev => prev.filter(l => l.id !== id));
    return true;
  };

  return {
    lendingList,
    loading,
    error,
    refetch: fetchLending,
    createLending,
    createRepayment,
    deleteLending,
  };
}
