import { LoadQueryOps } from '@supabase-cache-helpers/postgrest-fetcher';
import { useQueryClient } from '@tanstack/react-query';

import { decode } from './key';
import { usePostgrestFilterCache } from './use-postgrest-filter-cache';

export const useQueriesForTableLoader = (table: string) => {
  const queryClient = useQueryClient();
  const getPostgrestFilter = usePostgrestFilterCache();

  return () =>
    queryClient
      .getQueryCache()
      .getAll()
      .map((c) => c.queryKey)
      .reduce<ReturnType<LoadQueryOps['queriesForTable']>>((prev, curr) => {
        const decodedKey = decode(curr);
        if (decodedKey?.table === table) {
          prev.push(getPostgrestFilter(decodedKey.queryKey).params);
        }
        return prev;
      }, []);
};
