import { PostgrestMutatorOpts } from '@supabase-cache-helpers/postgrest-mutate';
import { GenericTable } from '@supabase/postgrest-js/dist/module/types';
import {
  RealtimeChannel,
  RealtimePostgresChangesFilter,
  RealtimePostgresChangesPayload,
  REALTIME_LISTEN_TYPES,
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
} from '@supabase/supabase-js';
import { MutationOptions as ReactQueryMutatorOptions } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useDeleteItem, useUpsertItem } from '../cache';

/**
 * Options for the `useSubscription` hook.
 */
export type UseSubscriptionOpts<T extends GenericTable> = PostgrestMutatorOpts<
  T['Row']
> &
  ReactQueryMutatorOptions & {
    callback?: (
      event: RealtimePostgresChangesPayload<T['Row']>
    ) => void | Promise<void>;
  };

/**
 * Hook that sets up a real-time subscription to a Postgres database table.
 *
 * @param channel - The real-time channel to subscribe to.
 * @param filter - A filter that specifies the table and conditions for the subscription.
 * @param primaryKeys - An array of primary key column names for the table.
 * @param opts - Options for the mutation function used to upsert or delete rows in the cache.
 *
 * @returns An object containing the current status of the subscription.
 */
function useSubscription<T extends GenericTable>(
  channel: RealtimeChannel | null,
  filter: Omit<
    RealtimePostgresChangesFilter<`${REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.ALL}`>,
    'table'
  > & { table: string },
  primaryKeys: (keyof T['Row'])[],
  opts?: UseSubscriptionOpts<T>
) {
  const [status, setStatus] = useState<string>();
  const deleteItem = useDeleteItem({
    primaryKeys,
    table: filter.table,
    schema: filter.schema,
    opts,
  });
  const upsertItem = useUpsertItem({
    primaryKeys,
    table: filter.table,
    schema: filter.schema,
    opts,
  });

  useEffect(() => {
    if (!channel) return;

    const c = channel
      .on<T['Row']>(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        filter,
        async (payload) => {
          if (
            payload.eventType ===
              REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT ||
            payload.eventType === REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.UPDATE
          ) {
            await upsertItem(payload.new);
          } else if (
            payload.eventType === REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.DELETE
          ) {
            await deleteItem(payload.old);
          }
          if (opts?.callback) {
            opts.callback({
              ...payload,
            });
          }
        }
      )
      .subscribe((status: string) => setStatus(status));

    return () => {
      if (c) c.unsubscribe();
    };
  }, []);

  return { status };
}

export { useSubscription };
