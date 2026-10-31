import assert from "node:assert";
import test from "node:test";
import { fetchLiveListings, fetchLiveGrants } from "./api";

test("fetchLiveListings retrieves listings with valid schema", async () => {
  const listings = await fetchLiveListings({ minReward: 100 });
  assert.ok(Array.isArray(listings));
  assert.ok(listings.length > 0);
  const first = listings[0];
  assert.ok(first.title);
  assert.ok(first.slug);
});

test("fetchLiveGrants retrieves active grant programs", async () => {
  const grants = await fetchLiveGrants();
  assert.ok(Array.isArray(grants));
  assert.ok(grants.length > 0);
  const grant = grants[0];
  assert.ok(grant.title);
  assert.ok(grant.slug);
});
