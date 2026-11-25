const mockGetAllCards = jest.fn();

jest.mock('@/core/database/card-repository', () => ({
  getAllCards: (...args: unknown[]) => mockGetAllCards(...args)
}));

import AsyncStorage from '@react-native-async-storage/async-storage';

import { LoyaltyCard } from '@/core/schemas';

import {
  _BATCH_SIZE,
  _CLOUD_SYNC_COOLDOWN_MS,
  _LAST_CLOUD_SYNC_KEY,
  downloadCloudCards,
  forceSyncLocalCards,
  mergeCards,
  syncChangedCards,
  uploadLocalCards,
  type CloudFetchFn,
  type CloudUpsertFn
} from './cloud-sync';
import { CloudCardRow } from './mappers';
import { clearLastSyncAt } from './sync-timestamp';

const makeCard = (index: number): LoyaltyCard => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  name: `Store ${index}`,
  barcode: `barcode-${index}`,
  barcodeFormat: 'EAN13',
  brandId: null,
  color: 'blue',
  isFavorite: false,
  lastUsedAt: null,
  usageCount: 0,
  createdAt: '2026-03-21T10:30:00.123Z',
  updatedAt: '2026-03-21T10:30:00.123Z'
});

let upsert: jest.Mock<ReturnType<CloudUpsertFn>, Parameters<CloudUpsertFn>>;

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  upsert = jest.fn().mockResolvedValue({ error: null });
  mockGetAllCards.mockResolvedValue([]);
});

describe('uploadLocalCards', () => {
  it('returns error on invalid user id', async () => {
    const result = await uploadLocalCards('', upsert);

    expect(result.success).toBe(false);
    expect(result.errors[0]?.code).toBe('SYNC_INVALID_USER');
    expect(upsert).not.toHaveBeenCalled();
  });

  it('uploads cards in a single batch', async () => {
    mockGetAllCards.mockResolvedValue([makeCard(1), makeCard(2)]);

    const result = await uploadLocalCards('11111111-1111-4111-8111-111111111111', upsert, {
      forceSync: true
    });

    expect(result).toEqual({
      success: true,
      uploadedCount: 2,
      failedCount: 0,
      errors: [],
      throttled: false
    });
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it('uploads cards in batches of 50', async () => {
    const cards = Array.from({ length: _BATCH_SIZE + 1 }, (_, index) => makeCard(index));
    mockGetAllCards.mockResolvedValue(cards);

    const result = await uploadLocalCards('11111111-1111-4111-8111-111111111111', upsert, {
      forceSync: true
    });

    expect(result.success).toBe(true);
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert.mock.calls[0]?.[0]).toHaveLength(_BATCH_SIZE);
    expect(upsert.mock.calls[1]?.[0]).toHaveLength(1);
  });

  it('continues uploading when a batch fails', async () => {
    const cards = Array.from({ length: _BATCH_SIZE * 2 }, (_, index) => makeCard(index));
    mockGetAllCards.mockResolvedValue(cards);

    upsert.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: 'Network down' });

    const result = await uploadLocalCards('11111111-1111-4111-8111-111111111111', upsert, {
      forceSync: true
    });

    expect(result.success).toBe(false);
    expect(result.uploadedCount).toBe(_BATCH_SIZE);
    expect(result.failedCount).toBe(_BATCH_SIZE);
    expect(result.errors[0]?.code).toBe('SYNC_UPLOAD_BATCH_FAILED');
    expect(upsert).toHaveBeenCalledTimes(2);
  });

  it('skips sync when last sync is inside cooldown window', async () => {
    const now = 1_000_000;
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      String(now - _CLOUD_SYNC_COOLDOWN_MS + 1000)
    );

    const result = await uploadLocalCards('11111111-1111-4111-8111-111111111111', upsert, {
      now: () => now
    });

    expect(result).toEqual({
      success: true,
      uploadedCount: 0,
      failedCount: 0,
      errors: [],
      throttled: true
    });
    expect(mockGetAllCards).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('persists last sync timestamp on successful sync', async () => {
    mockGetAllCards.mockResolvedValue([makeCard(1)]);

    await uploadLocalCards('11111111-1111-4111-8111-111111111111', upsert, {
      now: () => 1234,
      forceSync: true
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(_LAST_CLOUD_SYNC_KEY, '1234');
  });

  it('forceSync bypasses throttle', async () => {
    const now = 1_000_000;
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(String(now - 1000));
    mockGetAllCards.mockResolvedValue([makeCard(1)]);

    const result = await forceSyncLocalCards('11111111-1111-4111-8111-111111111111', upsert, {
      now: () => now
    });

    expect(result.success).toBe(true);
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it('returns success with zero uploads when local cards are empty', async () => {
    mockGetAllCards.mockResolvedValue([]);

    const result = await uploadLocalCards('11111111-1111-4111-8111-111111111111', upsert, {
      forceSync: true,
      now: () => 42
    });

    expect(result).toEqual({
      success: true,
      uploadedCount: 0,
      failedCount: 0,
      errors: [],
      throttled: false
    });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(_LAST_CLOUD_SYNC_KEY, '42');
  });
});

// ===================================================================
// mergeCards (Story 7.2)
// ===================================================================

describe('mergeCards', () => {
  it('returns empty result for empty local + empty cloud', () => {
    const result = mergeCards([], []);

    expect(result.merged).toEqual([]);
    expect(result.added).toBe(0);
    expect(result.updated).toBe(0);
    expect(result.unchanged).toBe(0);
  });

  it('keeps all local cards when cloud is empty', () => {
    const locals = [makeCard(1), makeCard(2), makeCard(3)];
    const result = mergeCards(locals, []);

    expect(result.merged).toHaveLength(3);
    expect(result.unchanged).toBe(3);
    expect(result.added).toBe(0);
    expect(result.updated).toBe(0);
  });

  it('adds all cloud cards when local is empty', () => {
    const cloud = [makeCard(1), makeCard(2)];
    const result = mergeCards([], cloud);

    expect(result.merged).toHaveLength(2);
    expect(result.added).toBe(2);
    expect(result.unchanged).toBe(0);
    expect(result.updated).toBe(0);
  });

  it('keeps cloud card when cloud is newer (partial overlap)', () => {
    const localCard = {
      ...makeCard(1),
      name: 'Old Local',
      updatedAt: '2026-03-20T10:00:00.000Z'
    };
    const cloudCard = {
      ...makeCard(1),
      name: 'Updated Cloud',
      updatedAt: '2026-03-21T10:00:00.000Z'
    };

    const result = mergeCards([localCard], [cloudCard]);

    expect(result.merged).toHaveLength(1);
    expect(result.merged[0]?.name).toBe('Updated Cloud');
    expect(result.updated).toBe(1);
  });

  it('keeps local card when local is newer', () => {
    const localCard = {
      ...makeCard(1),
      name: 'Newer Local',
      updatedAt: '2026-03-22T10:00:00.000Z'
    };
    const cloudCard = {
      ...makeCard(1),
      name: 'Older Cloud',
      updatedAt: '2026-03-20T10:00:00.000Z'
    };

    const result = mergeCards([localCard], [cloudCard]);

    expect(result.merged).toHaveLength(1);
    expect(result.merged[0]?.name).toBe('Newer Local');
    expect(result.unchanged).toBe(1);
  });

  it('cloud wins on identical updatedAt (deterministic tiebreak)', () => {
    const timestamp = '2026-03-21T10:00:00.000Z';
    const localCard = { ...makeCard(1), name: 'Local', updatedAt: timestamp };
    const cloudCard = { ...makeCard(1), name: 'Cloud', updatedAt: timestamp };

    const result = mergeCards([localCard], [cloudCard]);

    expect(result.merged[0]?.name).toBe('Cloud');
    expect(result.unchanged).toBe(1); // same timestamp = unchanged
    expect(result.updated).toBe(0);
  });

  it('handles full overlap with identical cards as unchanged', () => {
    const cards = [makeCard(1), makeCard(2), makeCard(3)];
    const result = mergeCards(cards, cards);

    expect(result.merged).toHaveLength(3);
    expect(result.unchanged).toBe(3);
    expect(result.added).toBe(0);
    expect(result.updated).toBe(0);
  });

  it('handles mixed scenario: cloud-only + local-only + overlap', () => {
    const localOnly = { ...makeCard(10), updatedAt: '2026-03-21T10:00:00.000Z' };
    const shared = { ...makeCard(5), updatedAt: '2026-03-20T10:00:00.000Z' };
    const cloudOnly = { ...makeCard(20), updatedAt: '2026-03-21T10:00:00.000Z' };
    const sharedCloudNewer = {
      ...makeCard(5),
      name: 'Cloud Updated',
      updatedAt: '2026-03-22T10:00:00.000Z'
    };

    const result = mergeCards([localOnly, shared], [cloudOnly, sharedCloudNewer]);

    expect(result.merged).toHaveLength(3);
    expect(result.added).toBe(1); // cloudOnly
    expect(result.updated).toBe(1); // shared → cloud newer
    expect(result.unchanged).toBe(1); // localOnly
  });

  it('does not lose any cards during merge', () => {
    const locals = Array.from({ length: 5 }, (_, i) => makeCard(i));
    const cloud = Array.from({ length: 5 }, (_, i) => makeCard(i + 3)); // overlap at 3,4

    const result = mergeCards(locals, cloud);

    // 5 local + 5 cloud - 2 overlap = 8 unique cards
    expect(result.merged).toHaveLength(8);
  });
});

// ===================================================================
// downloadCloudCards (Story 7.2)
// ===================================================================

const makeCloudRow = (index: number): CloudCardRow => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: `Store ${index}`,
  barcode: `barcode-${index}`,
  barcode_format: 'EAN13',
  brand_id: null,
  color: 'blue',
  is_favorite: false,
  last_used_at: null,
  usage_count: 0,
  created_at: '2026-03-21T10:30:00.123Z',
  updated_at: '2026-03-21T10:30:00.123Z'
});

let fetchFn: jest.Mock<ReturnType<CloudFetchFn>, Parameters<CloudFetchFn>>;

describe('downloadCloudCards', () => {
  beforeEach(() => {
    fetchFn = jest.fn().mockResolvedValue({ data: [], error: null });
  });

  it('returns error on invalid userId', async () => {
    const result = await downloadCloudCards('', fetchFn);

    expect(result.success).toBe(false);
    expect(result.errors[0]?.code).toBe('SYNC_INVALID_USER');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('downloads and merges cloud cards (happy path)', async () => {
    fetchFn.mockResolvedValue({
      data: [makeCloudRow(1), makeCloudRow(2)],
      error: null
    });
    mockGetAllCards.mockResolvedValue([]);

    const result = await downloadCloudCards('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', fetchFn, {
      forceSync: true
    });

    expect(result.success).toBe(true);
    expect(result.downloadedCount).toBe(2);
    expect(result.mergeResult?.added).toBe(2);
    expect(result.mergeResult?.merged).toHaveLength(2);
  });

  it('returns empty merge when cloud has no cards', async () => {
    fetchFn.mockResolvedValue({ data: [], error: null });
    mockGetAllCards.mockResolvedValue([makeCard(1)]);

    const result = await downloadCloudCards('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', fetchFn, {
      forceSync: true
    });

    expect(result.success).toBe(true);
    expect(result.downloadedCount).toBe(0);
    expect(result.mergeResult?.unchanged).toBe(1);
    expect(result.mergeResult?.added).toBe(0);
  });

  it('returns error on fetch failure', async () => {
    fetchFn.mockResolvedValue({ data: [], error: 'Network timeout' });

    const result = await downloadCloudCards('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', fetchFn, {
      forceSync: true
    });

    expect(result.success).toBe(false);
    expect(result.errors[0]?.code).toBe('SYNC_DOWNLOAD_FETCH_FAILED');
    expect(result.mergeResult).toBeNull();
  });

  it('skips invalid cloud rows and continues', async () => {
    const validRow = makeCloudRow(1);
    const invalidRow = { ...makeCloudRow(2), id: 'not-a-uuid' };
    fetchFn.mockResolvedValue({
      data: [validRow, invalidRow],
      error: null
    });
    mockGetAllCards.mockResolvedValue([]);

    const result = await downloadCloudCards('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', fetchFn, {
      forceSync: true
    });

    expect(result.success).toBe(true);
    expect(result.downloadedCount).toBe(1);
    expect(result.mergeResult?.skipped).toBe(1);
    expect(result.mergeResult?.added).toBe(1);
  });

  it('respects throttle when not forced', async () => {
    const now = 1_000_000;
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      String(now - _CLOUD_SYNC_COOLDOWN_MS + 1000)
    );

    const result = await downloadCloudCards('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', fetchFn, {
      now: () => now
    });

    expect(result.throttled).toBe(true);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('forceSync bypasses throttle', async () => {
    const now = 1_000_000;
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(String(now - 1000));
    fetchFn.mockResolvedValue({ data: [makeCloudRow(1)], error: null });
    mockGetAllCards.mockResolvedValue([]);

    const result = await downloadCloudCards('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', fetchFn, {
      forceSync: true
    });

    expect(result.success).toBe(true);
    expect(result.downloadedCount).toBe(1);
  });

  it('merges correctly when cloud and local have overlapping cards', async () => {
    const cloudRow = {
      ...makeCloudRow(1),
      name: 'Cloud Name',
      updated_at: '2026-03-23T10:00:00.000Z'
    };
    fetchFn.mockResolvedValue({ data: [cloudRow], error: null });

    const localCard = {
      ...makeCard(1),
      name: 'Local Name',
      updatedAt: '2026-03-20T10:00:00.000Z'
    };
    mockGetAllCards.mockResolvedValue([localCard]);

    const result = await downloadCloudCards('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', fetchFn, {
      forceSync: true
    });

    expect(result.success).toBe(true);
    expect(result.mergeResult?.merged[0]?.name).toBe('Cloud Name');
    expect(result.mergeResult?.updated).toBe(1);
  });

  it('persists last sync timestamp on successful download', async () => {
    fetchFn.mockResolvedValue({ data: [makeCloudRow(1)], error: null });
    mockGetAllCards.mockResolvedValue([]);

    await downloadCloudCards('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', fetchFn, {
      forceSync: true,
      now: () => 5678
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(_LAST_CLOUD_SYNC_KEY, '5678');
  });
});

// ─── downloadCloudCards deletion drain (Story 16.11) ──────────

describe('downloadCloudCards — deletion drain (Story 16.11)', () => {
  const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const idOk = makeCloudRow(0).id;
  const idFail = makeCloudRow(1).id;

  let deleteFromCloud: jest.Mock<Promise<{ error: string | null }>, [string, string]>;
  let getPending: jest.Mock<Promise<string[]>, []>;
  let removeDrained: jest.Mock<Promise<void>, [string[]]>;
  const bundle = () => ({ getPendingDeletions: getPending, deleteFromCloud, removeDrained });

  beforeEach(() => {
    fetchFn = jest.fn().mockResolvedValue({ data: [], error: null });
    deleteFromCloud = jest.fn().mockResolvedValue({ error: null });
    getPending = jest.fn().mockResolvedValue([]);
    removeDrained = jest.fn().mockResolvedValue(undefined);
  });

  it('filters a pending-deletion card out of the merge and deletes it from the cloud', async () => {
    getPending.mockResolvedValue([idOk]);
    fetchFn.mockResolvedValue({ data: [makeCloudRow(0), makeCloudRow(2)], error: null });
    mockGetAllCards.mockResolvedValue([]); // card already hard-deleted locally

    const result = await downloadCloudCards(userId, fetchFn, {
      forceSync: true,
      deletions: bundle()
    });

    expect(result.mergeResult?.merged.find((c) => c.id === idOk)).toBeUndefined();
    expect(deleteFromCloud).toHaveBeenCalledWith(idOk, userId);
    expect(removeDrained).toHaveBeenCalledWith([idOk]);
  });

  it('retains a failed cloud-deletion id and still reports success (AC3)', async () => {
    getPending.mockResolvedValue([idOk]);
    deleteFromCloud.mockResolvedValue({ error: 'server 500' });
    fetchFn.mockResolvedValue({ data: [makeCloudRow(0)], error: null });

    const result = await downloadCloudCards(userId, fetchFn, {
      forceSync: true,
      deletions: bundle()
    });

    expect(result.success).toBe(true); // a failed drain never fails the sync
    expect(removeDrained).not.toHaveBeenCalled(); // nothing drained → queue untouched
  });

  it('removes only the succeeded ids on partial failure (AC3)', async () => {
    getPending.mockResolvedValue([idOk, idFail]);
    deleteFromCloud.mockImplementation(async (id) =>
      id === idFail ? { error: 'boom' } : { error: null }
    );
    fetchFn.mockResolvedValue({ data: [makeCloudRow(0), makeCloudRow(1)], error: null });

    await downloadCloudCards(userId, fetchFn, { forceSync: true, deletions: bundle() });

    expect(removeDrained).toHaveBeenCalledWith([idOk]);
  });

  it('does not read or drain the queue when no deletions bundle is provided (back-compat)', async () => {
    getPending.mockResolvedValue([idOk]);
    fetchFn.mockResolvedValue({ data: [makeCloudRow(0)], error: null });

    await downloadCloudCards(userId, fetchFn, { forceSync: true });

    expect(getPending).not.toHaveBeenCalled();
    expect(deleteFromCloud).not.toHaveBeenCalled();
  });

  it('does not delete or remove when the deletion queue is empty', async () => {
    getPending.mockResolvedValue([]); // empty queue
    fetchFn.mockResolvedValue({ data: [makeCloudRow(0)], error: null });

    await downloadCloudCards(userId, fetchFn, { forceSync: true, deletions: bundle() });

    expect(deleteFromCloud).not.toHaveBeenCalled();
    expect(removeDrained).not.toHaveBeenCalled();
  });

  // The erase test swaps AsyncStorage for a store of its own; put the shared mock back after it.
  let storageStubs: (readonly [jest.Mock, ((...args: never[]) => unknown) | undefined])[] = [];
  afterEach(() => {
    for (const [fn, impl] of storageStubs) {
      if (impl) fn.mockImplementation(impl);
    }
    storageStubs = [];
  });

  // Story 16.45: signing out with "erase" empties the local database without queueing deletions,
  // and clears the sync timestamps, so the first (unforced) sync after signing back in — even
  // within the cooldown of the last one — restores every cloud card and deletes none from cloud.
  it('downloads every cloud card and deletes none after a sign-out erase', async () => {
    const now = 1_000_000;
    // A store of its own, so no earlier test's getItem stub can stand in for the cooldown key.
    const store = new Map<string, string>();
    storageStubs = (['getItem', 'setItem', 'removeItem'] as const).map((name) => {
      const fn = AsyncStorage[name] as jest.Mock;
      return [fn, fn.getMockImplementation()] as const;
    });
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) =>
      store.has(key) ? store.get(key) : null
    );
    (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
      store.set(key, value);
    });
    (AsyncStorage.removeItem as jest.Mock).mockImplementation(async (key: string) => {
      store.delete(key);
    });
    store.set(_LAST_CLOUD_SYNC_KEY, String(now - 1000)); // synced a second ago
    await clearLastSyncAt();

    getPending.mockResolvedValue([]);
    mockGetAllCards.mockResolvedValue([]);
    const cloudRows = [makeCloudRow(0), makeCloudRow(1), makeCloudRow(2)];
    fetchFn.mockResolvedValue({ data: cloudRows, error: null });

    const result = await downloadCloudCards(userId, fetchFn, {
      now: () => now,
      deletions: bundle()
    });

    expect(result.throttled).toBe(false);
    expect(result.success).toBe(true);
    expect(result.downloadedCount).toBe(3);
    expect(result.mergeResult?.added).toBe(3);
    expect(result.mergeResult?.merged.map((card) => card.id).sort()).toEqual(
      cloudRows.map((row) => row.id).sort()
    );
    expect(deleteFromCloud).not.toHaveBeenCalled();
    expect(removeDrained).not.toHaveBeenCalled();
  });

  it('does not delete a queued id that is absent from the cloud (already gone)', async () => {
    getPending.mockResolvedValue([idFail]); // queued for deletion…
    fetchFn.mockResolvedValue({ data: [makeCloudRow(0)], error: null }); // …but cloud only has idOk

    await downloadCloudCards(userId, fetchFn, { forceSync: true, deletions: bundle() });

    expect(deleteFromCloud).not.toHaveBeenCalled(); // nothing in the cloud to delete
    expect(removeDrained).not.toHaveBeenCalled();
  });

  it('does not touch the deletion bundle when the download is throttled', async () => {
    const now = 1_000_000;
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      String(now - _CLOUD_SYNC_COOLDOWN_MS + 1000)
    );
    getPending.mockResolvedValue([idOk]);

    const result = await downloadCloudCards(userId, fetchFn, {
      now: () => now,
      deletions: bundle()
    });

    expect(result.throttled).toBe(true);
    expect(getPending).not.toHaveBeenCalled(); // bundle never consulted under cooldown
    expect(deleteFromCloud).not.toHaveBeenCalled();
    expect(removeDrained).not.toHaveBeenCalled();
  });
});

// ─── syncChangedCards (Story 7.3 + 7.4 delta) ─────────────────

describe('syncChangedCards', () => {
  let upsertFn: jest.MockedFunction<CloudUpsertFn>;
  const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  beforeEach(() => {
    upsertFn = jest.fn().mockResolvedValue({ error: null });
  });

  it('returns error for empty userId', async () => {
    const result = await syncChangedCards('', upsertFn);
    expect(result.success).toBe(false);
    expect(result.errors[0]?.code).toBe('SYNC_INVALID_USER');
  });

  it('returns success with 0 upserted when no local cards', async () => {
    mockGetAllCards.mockResolvedValue([]);
    const result = await syncChangedCards(userId, upsertFn);
    expect(result.success).toBe(true);
    expect(result.upsertedCount).toBe(0);
    expect(result.skippedCount).toBe(0);
    expect(upsertFn).not.toHaveBeenCalled();
  });

  it('upserts all local cards to cloud (null lastSyncAt = full sync)', async () => {
    mockGetAllCards.mockResolvedValue([makeCard(0), makeCard(1)]);
    const result = await syncChangedCards(userId, upsertFn);
    expect(result.success).toBe(true);
    expect(result.upsertedCount).toBe(2);
    expect(result.skippedCount).toBe(0);
    expect(upsertFn).toHaveBeenCalledTimes(1);
  });

  it('batches cards when exceeding BATCH_SIZE', async () => {
    const cards = Array.from({ length: _BATCH_SIZE + 10 }, (_, i) => makeCard(i));
    mockGetAllCards.mockResolvedValue(cards);
    const result = await syncChangedCards(userId, upsertFn);
    expect(upsertFn).toHaveBeenCalledTimes(2);
    expect(result.upsertedCount).toBe(_BATCH_SIZE + 10);
  });

  it('reports errors on upsert failure', async () => {
    mockGetAllCards.mockResolvedValue([makeCard(0)]);
    upsertFn.mockResolvedValue({ error: 'Cloud unavailable' });
    const result = await syncChangedCards(userId, upsertFn);
    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toBe('Cloud unavailable');
  });

  it('does NOT update cooldown timestamp', async () => {
    mockGetAllCards.mockResolvedValue([makeCard(0)]);
    await syncChangedCards(userId, upsertFn);
    // syncChangedCards is throttle-free; it must NOT touch lastCloudSync
    expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(_LAST_CLOUD_SYNC_KEY, expect.anything());
  });

  // ─── Delta upload tests (Story 7.4 — AC1, AC5) ───────────────

  it('uploads only cards changed after lastSyncAt', async () => {
    const unchanged = { ...makeCard(0), updatedAt: '2026-03-20T10:00:00.000Z' };
    const changed1 = { ...makeCard(1), updatedAt: '2026-03-22T10:00:00.000Z' };
    const changed2 = { ...makeCard(2), updatedAt: '2026-03-23T08:00:00.000Z' };
    mockGetAllCards.mockResolvedValue([unchanged, changed1, changed2]);

    const result = await syncChangedCards(userId, upsertFn, '2026-03-21T00:00:00.000Z');

    expect(result.success).toBe(true);
    expect(result.upsertedCount).toBe(2);
    expect(result.skippedCount).toBe(1);
    expect(upsertFn).toHaveBeenCalledTimes(1);
  });

  it('uploads 0 cards when none changed since lastSyncAt', async () => {
    const cards = Array.from({ length: 100 }, (_, i) => ({
      ...makeCard(i),
      updatedAt: '2026-03-19T10:00:00.000Z'
    }));
    mockGetAllCards.mockResolvedValue(cards);

    const result = await syncChangedCards(userId, upsertFn, '2026-03-20T00:00:00.000Z');

    expect(result.success).toBe(true);
    expect(result.upsertedCount).toBe(0);
    expect(result.skippedCount).toBe(100);
    expect(upsertFn).not.toHaveBeenCalled();
  });

  it('uploads all cards when all changed since lastSyncAt', async () => {
    const cards = Array.from({ length: 3 }, (_, i) => ({
      ...makeCard(i),
      updatedAt: '2026-03-25T10:00:00.000Z'
    }));
    mockGetAllCards.mockResolvedValue(cards);

    const result = await syncChangedCards(userId, upsertFn, '2026-03-20T00:00:00.000Z');

    expect(result.success).toBe(true);
    expect(result.upsertedCount).toBe(3);
    expect(result.skippedCount).toBe(0);
  });

  it('does NOT upload card when updatedAt === lastSyncAt (strict >)', async () => {
    const exactMatch = { ...makeCard(0), updatedAt: '2026-03-20T10:00:00.000Z' };
    mockGetAllCards.mockResolvedValue([exactMatch]);

    const result = await syncChangedCards(userId, upsertFn, '2026-03-20T10:00:00.000Z');

    expect(result.upsertedCount).toBe(0);
    expect(result.skippedCount).toBe(1);
    expect(upsertFn).not.toHaveBeenCalled();
  });

  it('falls back to full upload when lastSyncAt is null', async () => {
    const cards = Array.from({ length: 5 }, (_, i) => makeCard(i));
    mockGetAllCards.mockResolvedValue(cards);

    const result = await syncChangedCards(userId, upsertFn, null);

    expect(result.upsertedCount).toBe(5);
    expect(result.skippedCount).toBe(0);
  });
});
