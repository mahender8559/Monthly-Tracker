'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import type { Category } from '@/types/finance';

export function useCategories(userId?: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (!userId) { setCategories([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('display_order')
      .order('name');
    const existingCategories = (data ?? []) as Category[];
    setCategories(existingCategories);
    setLoading(false);
  }, [userId]);
  useEffect(() => { void refresh(); }, [refresh]);
  return { categories, loading, refresh, supabase };
}
