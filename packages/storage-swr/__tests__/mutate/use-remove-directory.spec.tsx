import { fireEvent, screen } from '@testing-library/react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useRemoveDirectory } from '../../src';
import { cleanup, renderWithConfig, upload } from '../utils';
import { fetchDirectory } from '@supabase-cache-helpers/storage-fetcher';

const TEST_PREFIX = 'postgrest-storage-remove';

describe('useRemoveDirectory', () => {
  let client: SupabaseClient;
  let provider: Map<any, any>;
  let dirName: string;
  let files: string[];

  beforeAll(async () => {
    dirName = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );

    await Promise.all([
      cleanup(client, 'public_contact_files', dirName),
      cleanup(client, 'private_contact_files', dirName),
    ]);

    files = await upload(client, 'private_contact_files', dirName);
  });
  beforeEach(() => {
    provider = new Map();
  });

  it('should remove all files in a directory', async () => {
    function Page() {
      const { trigger: remove, isMutating } = useRemoveDirectory(
        client.storage.from('private_contact_files')
      );
      return (
        <>
          <div data-testid="remove" onClick={() => remove(dirName)} />
          <div>{`isMutating: ${isMutating}`}</div>
        </>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    fireEvent.click(screen.getByTestId('remove'));
    await screen.findByText('isMutating: false', {}, { timeout: 10000 });
    await expect(
      fetchDirectory(client.storage.from('private_contact_files'), dirName)
    ).resolves.toEqual([]);
  });
});
