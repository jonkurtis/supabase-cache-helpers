import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./database.types";
import "./utils";

import { buildUpsertFetcher } from "../src";

const TEST_PREFIX = "postgrest-fetcher-upsert-";

describe("upsert", () => {
  let client: SupabaseClient<Database>;
  let testRunPrefix: string;

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
    await client.from("contact").delete().ilike("username", `${TEST_PREFIX}%`);
  });

  it("should support upsert many", async () => {
    await expect(
      buildUpsertFetcher(client.from("contact"), { parsersForTable: () => [] })(
        [
          { username: `${testRunPrefix}-username-1` },
          { username: `${testRunPrefix}-username-2` },
        ]
      )
    ).resolves.toEqual(null);
  });

  it("should support passing a query", async () => {
    await expect(
      buildUpsertFetcher(client.from("contact"), {
        query: "username",
        parsersForTable: () => [],
      })([
        { username: `${testRunPrefix}-username-1` },
        { username: `${testRunPrefix}-username-2` },
      ])
    ).resolves.toEqual([
      { username: `${testRunPrefix}-username-1` },
      { username: `${testRunPrefix}-username-2` },
    ]);
  });
});
