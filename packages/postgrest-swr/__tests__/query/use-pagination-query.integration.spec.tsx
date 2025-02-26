import { fireEvent, screen } from '@testing-library/react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { usePaginationQuery } from '../../src';
import { renderWithConfig } from '../utils';
import type { Database } from '../database.types';
import { useState } from 'react';

const TEST_PREFIX = 'postgrest-swr-pagination';

describe('usePaginationQuery', () => {
  let client: SupabaseClient<Database>;
  let provider: Map<any, any>;
  let testRunPrefix: string;
  let contacts: Database['public']['Tables']['contact']['Row'][];

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
    await client.from('contact').delete().ilike('username', `${TEST_PREFIX}%`);

    const { data } = await client
      .from('contact')
      .insert([
        { username: `${testRunPrefix}-username-1` },
        { username: `${testRunPrefix}-username-2` },
        { username: `${testRunPrefix}-username-3` },
        { username: `${testRunPrefix}-username-4` },
      ])
      .select('*')
      .throwOnError();
    contacts = data ?? [];
    expect(contacts).toHaveLength(4);
  });

  beforeEach(() => {
    provider = new Map();
  });

  it('should paginate correctly', async () => {
    function Page() {
      const {
        currentPage,
        nextPage,
        previousPage,
        setPage,
        pages,
        pageIndex,
        isValidating,
        error,
      } = usePaginationQuery(
        client
          .from('contact')
          .select('id,username')
          .ilike('username', `${testRunPrefix}%`)
          .order('username', { ascending: true }),
        { pageSize: 1, revalidateOnReconnect: true }
      );

      return (
        <div>
          {nextPage && (
            <div data-testid="nextPage" onClick={() => nextPage()} />
          )}
          {previousPage && (
            <div data-testid="previousPage" onClick={() => previousPage()} />
          )}
          <div data-testid="goToPageZero" onClick={() => setPage(0)} />
          <div data-testid="currentPage">
            {(currentPage ?? []).map((p) => (
              <div key={p.id}>{p.username}</div>
            ))}
          </div>
          <div data-testid="pages">
            {(pages ?? []).flat().map((p) => (
              <div key={p.id}>{p.id}</div>
            ))}
          </div>
          <div data-testid="pageIndex">{pageIndex}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText(
      `${testRunPrefix}-username-1`,
      {},
      { timeout: 10000 }
    );
    const currentPageList = screen.getByTestId('currentPage');
    expect(currentPageList.childElementCount).toEqual(1);
    expect(screen.getByTestId('pageIndex').textContent).toEqual('0');
    const pagesList = screen.getByTestId('pages');
    expect(pagesList.childElementCount).toEqual(1);

    fireEvent.click(screen.getByTestId('nextPage'));
    await screen.findByText(
      `${testRunPrefix}-username-2`,
      {},
      { timeout: 10000 }
    );

    await screen.findByTestId('previousPage', {}, { timeout: 10000 });
    expect(currentPageList.childElementCount).toEqual(1);
    expect(pagesList.childElementCount).toEqual(2);
    expect(screen.getByTestId('pageIndex').textContent).toEqual('1');

    fireEvent.click(screen.getByTestId('nextPage'));
    await screen.findByText(
      `${testRunPrefix}-username-3`,
      {},
      { timeout: 10000 }
    );

    expect(currentPageList.childElementCount).toEqual(1);
    expect(pagesList.childElementCount).toEqual(3);
    expect(screen.getByTestId('pageIndex').textContent).toEqual('2');

    fireEvent.click(screen.getByTestId('goToPageZero'));
    await screen.findByText(
      `${testRunPrefix}-username-1`,
      {},
      { timeout: 10000 }
    );
    expect(screen.getByTestId('pageIndex').textContent).toEqual('0');
  });

  it('should allow conditional queries', async () => {
    function Page() {
      const [condition, setCondition] = useState(false);
      const { pages, isLoading } = usePaginationQuery(
        condition
          ? client
              .from('contact')
              .select('id,username')
              .ilike('username', `${testRunPrefix}%`)
              .order('username', { ascending: true })
          : null,
        { pageSize: 1, revalidateOnReconnect: true }
      );
      return (
        <div>
          <div data-testid="setCondition" onClick={() => setCondition(true)} />
          <div data-testid="pages">
            {(pages ?? []).flat()[0]?.username ?? 'undefined'}
          </div>
          <div>{`isLoading: ${isLoading}`}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText('isLoading: false', {}, { timeout: 10000 });
    await screen.findByText('undefined', {}, { timeout: 10000 });
    fireEvent.click(screen.getByTestId('setCondition'));
    await screen.findByText(
      `${testRunPrefix}-username-1`,
      {},
      { timeout: 10000 }
    );
  });
});
