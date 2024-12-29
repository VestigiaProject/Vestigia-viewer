import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export function useRealtimeSubscription(
  table: string,
  filter: string,
  onChange: (payload: RealtimePostgresChangesPayload<any>) => void
) {
  useEffect(() => {
    const channel = supabase.channel(`${table}-${Date.now()}`);
    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter },
        (payload) => onChange(payload)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to real-time events on ${table}`);
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [table, filter, onChange]);
} 