import { SQLiteDatabase } from 'expo-sqlite';

import {
  applyWatchUsageEvents,
  getAllCards,
  getCardById,
  insertCard,
  updateCard,
  deleteCard,
  upsertCard,
  batchUpsertCards,
  deleteAllCards,
  getCardCount,
  incrementUsageCount,
  toggleFavorite
} from './card-repository';
import { LoyaltyCard } from '../schemas';
import { pushCardsToWearable } from '../wearable-sync';
import * as databaseModule from './database';

jest.mock('../wearable-sync', () => ({
  pushCardsToWearable: jest.fn().mockResolvedValue(undefined)
}));

type TestCardRow = {
  id: string;
  name: string;
  barcode: string;
  barcode_format: string;
  brand_id: string | null;
  color: string;
  is_favorite: number;
  last_used_at: string | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
};

const makeDb = (rows: Array<Partial<TestCardRow> | { count: number }> = []): SQLiteDatabase =>
  ({
    getAllAsync: jest.fn().mockResolvedValue(rows),
    getFirstAsync: jest.fn().mockResolvedValue(rows[0] ?? null),
    runAsync: jest.fn().mockResolvedValue(undefined),
    withTransactionAsync: jest.fn(
      async (fn: (...args: unknown[]) => Promise<unknown>) => await fn()
    )
  }) as unknown as SQLiteDatabase;

describe('card-repository', () => {
  afterEach(() => jest.restoreAllMocks());

  // Story 16.45: erasing the cards on sign-out must also empty the paired watch's list.
  test('deleteAllCards with no cards left pushes the empty card list to the wearable', async () => {
    const db = makeDb([]);
    await deleteAllCards(db);
    expect(db.runAsync).toHaveBeenCalledWith('DELETE FROM loyalty_cards');
    expect(pushCardsToWearable).toHaveBeenLastCalledWith([]);
  });
  const sampleRow = {
    id: '1',
    name: 'Card A',
    barcode: '12345',
    barcode_format: 'ean13',
    brand_id: 'brand1',
    color: '#ffffff',
    is_favorite: 1,
    last_used_at: null,
    usage_count: 2,
    created_at: '2020-01-01',
    updated_at: '2020-01-02'
  };

  const sampleCard: LoyaltyCard = {
    id: '1',
    name: 'Card A',
    barcode: '12345',
    barcodeFormat: 'EAN13',
    brandId: 'brand1',
    color: 'green',
    isFavorite: true,
    lastUsedAt: null,
    usageCount: 2,
    createdAt: '2020-01-01',
    updatedAt: '2020-01-02'
  };

  test('getAllCards maps rows to domain objects', async () => {
    const db = makeDb([sampleRow]);
    const cards = await getAllCards(db);
    expect(db.getAllAsync).toHaveBeenCalled();
    expect(cards).toHaveLength(1);
    expect(cards[0]!.id).toBe(sampleRow.id);
    expect(cards[0]!.isFavorite).toBe(true);
  });

  test('getCardById returns card when found and null when missing', async () => {
    const dbFound = makeDb([sampleRow]);
    const found = await getCardById('1', dbFound);
    expect(dbFound.getFirstAsync).toHaveBeenCalled();
    expect(found).not.toBeNull();

    const dbMissing = makeDb([]);
    const missing = await getCardById('2', dbMissing);
    expect(missing).toBeNull();
  });

  test('insertCard, updateCard, deleteCard, upsertCard and deleteAllCards call DB methods', async () => {
    const db = makeDb();
    await insertCard(sampleCard, db);
    expect(db.withTransactionAsync).toHaveBeenCalled();
    expect(db.runAsync).toHaveBeenCalled();

    (db.runAsync as jest.Mock).mockClear();
    await updateCard(sampleCard, db);
    expect(db.withTransactionAsync).toHaveBeenCalled();
    expect(db.runAsync).toHaveBeenCalled();

    (db.runAsync as jest.Mock).mockClear();
    await upsertCard(sampleCard, db);
    expect(db.withTransactionAsync).toHaveBeenCalled();
    expect(db.runAsync).toHaveBeenCalled();

    (db.runAsync as jest.Mock).mockClear();
    await deleteCard('1', db);
    expect(db.withTransactionAsync).toHaveBeenCalled();
    expect(db.runAsync).toHaveBeenCalled();

    (db.runAsync as jest.Mock).mockClear();
    await deleteAllCards(db);
    expect(db.withTransactionAsync).toHaveBeenCalled();
    expect(db.runAsync).toHaveBeenCalledWith('DELETE FROM loyalty_cards');
  });

  test('getCardCount returns numeric count', async () => {
    const db = makeDb([{ count: 5 }]);
    const count = await getCardCount(db);
    expect(db.getFirstAsync).toHaveBeenCalled();
    expect(count).toBe(5);
  });

  test('uses default getDatabase when no db supplied', async () => {
    const db = makeDb([sampleRow]);
    const spy = jest.spyOn(databaseModule, 'getDatabase').mockReturnValue(db);
    const cards = await getAllCards();
    expect(spy).toHaveBeenCalled();
    expect(db.getAllAsync).toHaveBeenCalled();
    expect(cards[0]!.id).toBe(sampleRow.id);
  });

  test('other functions use default getDatabase when no db supplied', async () => {
    const db = makeDb([sampleRow]);
    const spy = jest.spyOn(databaseModule, 'getDatabase').mockReturnValue(db);

    // getCardById
    const found = await getCardById('1');
    expect(spy).toHaveBeenCalled();
    expect(db.getFirstAsync).toHaveBeenCalled();
    expect(found?.id).toBe(sampleRow.id);

    // insertCard
    (db.getFirstAsync as jest.Mock).mockClear();
    (db.runAsync as jest.Mock).mockClear();
    await insertCard(sampleCard);
    expect(db.withTransactionAsync).toHaveBeenCalled();
    expect(db.runAsync).toHaveBeenCalled();

    // updateCard
    (db.runAsync as jest.Mock).mockClear();
    await updateCard(sampleCard);
    expect(db.withTransactionAsync).toHaveBeenCalled();
    expect(db.runAsync).toHaveBeenCalled();

    // upsertCard
    (db.runAsync as jest.Mock).mockClear();
    await upsertCard(sampleCard);
    expect(db.withTransactionAsync).toHaveBeenCalled();
    expect(db.runAsync).toHaveBeenCalled();

    // deleteCard
    (db.runAsync as jest.Mock).mockClear();
    await deleteCard('1');
    expect(db.withTransactionAsync).toHaveBeenCalled();
    expect(db.runAsync).toHaveBeenCalled();

    // deleteAllCards
    (db.runAsync as jest.Mock).mockClear();
    await deleteAllCards();
    expect(db.withTransactionAsync).toHaveBeenCalled();
    expect(db.runAsync).toHaveBeenCalledWith('DELETE FROM loyalty_cards');

    // getCardCount
    (db.getFirstAsync as jest.Mock).mockClear();
    (db.getFirstAsync as jest.Mock).mockResolvedValueOnce({ count: 7 });
    const count = await getCardCount();
    expect(db.getFirstAsync).toHaveBeenCalled();
    expect(count).toBe(7);
  });

  test('batchUpsertCards runs all inserts in a single transaction', async () => {
    const db = makeDb();
    const cards: LoyaltyCard[] = [
      { ...sampleCard, id: '1' },
      { ...sampleCard, id: '2' }
    ];

    await batchUpsertCards(cards, db);

    expect(db.withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(db.runAsync).toHaveBeenCalledTimes(2);
  });

  test('batchUpsertCards is a no-op for empty array', async () => {
    const db = makeDb();
    await batchUpsertCards([], db);

    expect(db.withTransactionAsync).not.toHaveBeenCalled();
    expect(db.runAsync).not.toHaveBeenCalled();
  });

  test('batchUpsertCards uses default getDatabase when no db supplied', async () => {
    const db = makeDb();
    const spy = jest.spyOn(databaseModule, 'getDatabase').mockReturnValue(db);

    await batchUpsertCards([sampleCard]);

    expect(spy).toHaveBeenCalled();
    expect(db.withTransactionAsync).toHaveBeenCalled();
    expect(db.runAsync).toHaveBeenCalledTimes(1);
  });

  describe('incrementUsageCount (Story 9.1)', () => {
    test('increments usage_count by 1 and sets last_used_at + updated_at (AC1)', async () => {
      const db = makeDb();
      await incrementUsageCount('1', db);

      expect(db.runAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = (db.runAsync as jest.Mock).mock.calls[0];
      expect(sql).toContain('usage_count = usage_count + 1');
      expect(sql).toContain('last_used_at = ?');
      expect(sql).toContain('updated_at = ?');
      expect(sql).toContain('WHERE id = ?');

      // params: [last_used_at, updated_at, id] — timestamps equal, id last
      expect(params).toHaveLength(3);
      // AC1: value must be a real UTC ISO-8601 timestamp, not just any string
      const ISO_8601_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(params[0]).toMatch(ISO_8601_UTC);
      expect(params[0]).toBe(params[1]); // both columns stamped identically
      expect(params[2]).toBe('1');
    });

    test('calling twice issues two atomic increment statements (AC2)', async () => {
      const db = makeDb();
      await incrementUsageCount('1', db);
      await incrementUsageCount('1', db);

      expect(db.runAsync).toHaveBeenCalledTimes(2);
      (db.runAsync as jest.Mock).mock.calls.forEach(([sql]) => {
        expect(sql).toContain('usage_count = usage_count + 1');
      });
    });

    test('does not use a transaction (single atomic UPDATE)', async () => {
      const db = makeDb();
      await incrementUsageCount('1', db);
      expect(db.withTransactionAsync).not.toHaveBeenCalled();
    });

    test('pushes snapshot to watch after the update (AC3)', async () => {
      const db = makeDb([sampleRow]);
      await incrementUsageCount('1', db);
      // pushSnapshotToWatch reads all cards via getAllAsync
      expect(db.getAllAsync).toHaveBeenCalled();
    });

    test('silently no-ops for unknown id — no throw (AC5)', async () => {
      const db = makeDb();
      await expect(incrementUsageCount('does-not-exist', db)).resolves.toBeUndefined();
    });

    test('uses default getDatabase when no db supplied (AC4)', async () => {
      const db = makeDb([sampleRow]);
      const spy = jest.spyOn(databaseModule, 'getDatabase').mockReturnValue(db);
      await incrementUsageCount('1');
      expect(spy).toHaveBeenCalled();
      expect(db.runAsync).toHaveBeenCalled();
    });
  });

  describe('toggleFavorite (Story 9.2)', () => {
    test('issues a single atomic UPDATE that flips is_favorite and stamps updated_at (AC1)', async () => {
      const db = makeDb();
      await toggleFavorite('1', db);

      expect(db.runAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = (db.runAsync as jest.Mock).mock.calls[0];
      expect(sql).toContain('is_favorite = NOT is_favorite');
      expect(sql).toContain('updated_at = ?');
      expect(sql).toContain('WHERE id = ?');

      // params: [updated_at, id] — the NOT flip needs no bind parameter
      expect(params).toHaveLength(2);
      const ISO_8601_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(params[0]).toMatch(ISO_8601_UTC);
      expect(params[1]).toBe('1');
    });

    test('uses NOT is_favorite so one statement toggles both directions (AC1)', async () => {
      // The DB performs the flip; the identical statement turns false→true and
      // true→false, so the single statement covers both transitions.
      const db = makeDb();
      await toggleFavorite('1', db);
      await toggleFavorite('1', db);

      expect(db.runAsync).toHaveBeenCalledTimes(2);
      (db.runAsync as jest.Mock).mock.calls.forEach(([sql]) => {
        expect(sql).toContain('is_favorite = NOT is_favorite');
      });
    });

    test('does not use a transaction (single atomic UPDATE)', async () => {
      const db = makeDb();
      await toggleFavorite('1', db);
      expect(db.withTransactionAsync).not.toHaveBeenCalled();
    });

    test('pushes snapshot to watch after the update (AC5)', async () => {
      const db = makeDb([sampleRow]);
      await toggleFavorite('1', db);
      // pushSnapshotToWatch reads all cards via getAllAsync
      expect(db.getAllAsync).toHaveBeenCalled();
    });

    test('silently no-ops for unknown id — no throw (AC1)', async () => {
      const db = makeDb();
      await expect(toggleFavorite('does-not-exist', db)).resolves.toBeUndefined();
    });

    test('uses default getDatabase when no db supplied (AC4)', async () => {
      const db = makeDb([sampleRow]);
      const spy = jest.spyOn(databaseModule, 'getDatabase').mockReturnValue(db);
      await toggleFavorite('1');
      expect(spy).toHaveBeenCalled();
      expect(db.runAsync).toHaveBeenCalled();
    });
  });

  test('batchUpsertCards passes correct SQL parameters including boolean mapping', async () => {
    const db = makeDb();
    const card: LoyaltyCard = { ...sampleCard, id: 'batch-1', isFavorite: true, usageCount: 5 };

    await batchUpsertCards([card], db);

    expect(db.runAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT OR REPLACE'), [
      'batch-1',
      card.name,
      card.barcode,
      card.barcodeFormat,
      card.brandId,
      card.color,
      1,
      card.lastUsedAt,
      5,
      card.createdAt,
      card.updatedAt
    ]);
  });

  describe('applyWatchUsageEvents (Story 9.6)', () => {
    /**
     * Changes-aware mock: the production code branches on
     * `runAsync(...).changes` (0 = duplicate event / unknown card), which the
     * shared makeDb mock (resolves undefined) cannot express.
     */
    const makeUsageDb = (changesByCall: number[] = []) => {
      let call = 0;
      return {
        getAllAsync: jest.fn().mockResolvedValue([]),
        getFirstAsync: jest.fn().mockResolvedValue(null),
        runAsync: jest.fn().mockImplementation(async () => ({
          changes: changesByCall[call++] ?? 1,
          lastInsertRowId: 0
        })),
        withTransactionAsync: jest.fn(
          async (fn: (...args: unknown[]) => Promise<unknown>) => await fn()
        )
      } as unknown as SQLiteDatabase;
    };

    const event = { id: 'c1', usedAt: '2026-06-09T10:00:00.123Z' };

    test('wraps the batch in a transaction (project DB-write rule)', async () => {
      const db = makeUsageDb();
      await applyWatchUsageEvents([event], db);
      expect(db.withTransactionAsync).toHaveBeenCalledTimes(1);
    });

    test('records the event id then applies the commutative update (AC1, AC2)', async () => {
      const db = makeUsageDb();
      await applyWatchUsageEvents([event], db);

      const calls = (db.runAsync as jest.Mock).mock.calls;
      // 1: dedup insert, 2: card update, 3: prune
      expect(calls).toHaveLength(3);

      const [insertSql, insertParams] = calls[0];
      expect(insertSql).toContain('INSERT OR IGNORE INTO watch_usage_events');
      expect(insertParams[0]).toBe('c1:2026-06-09T10:00:00.123Z'); // "<cardId>:<usedAt>"

      const [updateSql, updateParams] = calls[1];
      expect(updateSql).toContain('usage_count = usage_count + 1');
      expect(updateSql).toContain('CASE');
      expect(updateSql).toContain('last_used_at < ?');
      expect(updateSql).toContain('updated_at = ?');
      expect(updateParams).toEqual([
        event.usedAt,
        event.usedAt,
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        'c1'
      ]);

      const [pruneSql] = calls[2];
      expect(pruneSql).toContain('DELETE FROM watch_usage_events');
    });

    test('skips the card update when the event id was already seen (AC3)', async () => {
      const db = makeUsageDb([0]); // dedup insert reports a conflict
      const applied = await applyWatchUsageEvents([event], db);

      expect(applied).toBe(0);
      const sqls = (db.runAsync as jest.Mock).mock.calls.map(([sql]) => sql as string);
      expect(sqls.some((sql) => sql.includes('usage_count'))).toBe(false);
    });

    test('pushes one snapshot per batch with applied events (AC5)', async () => {
      const db = makeUsageDb();
      await applyWatchUsageEvents([event, { id: 'c2', usedAt: '2026-06-09T11:00:00.456Z' }], db);
      // pushSnapshotToWatch reads all cards exactly once for the whole batch
      expect(db.getAllAsync).toHaveBeenCalledTimes(1);
    });

    test('does not push a snapshot when nothing was applied', async () => {
      const db = makeUsageDb([0]);
      await applyWatchUsageEvents([event], db);
      expect(db.getAllAsync).not.toHaveBeenCalled();
    });

    test('returns 0 and runs no SQL for an empty batch', async () => {
      const db = makeUsageDb();
      expect(await applyWatchUsageEvents([], db)).toBe(0);
      expect(db.runAsync).not.toHaveBeenCalled();
      expect(db.withTransactionAsync).not.toHaveBeenCalled();
    });

    test('counts only events that mutated a card row (unknown card → 0)', async () => {
      // insert succeeds (new event id) but the UPDATE matches no row
      const db = makeUsageDb([1, 0, 1]);
      const applied = await applyWatchUsageEvents([{ id: 'ghost', usedAt: event.usedAt }], db);
      expect(applied).toBe(0);
    });

    test('uses default getDatabase when no db supplied', async () => {
      const db = makeUsageDb();
      const spy = jest.spyOn(databaseModule, 'getDatabase').mockReturnValue(db);
      await applyWatchUsageEvents([event]);
      expect(spy).toHaveBeenCalled();
      expect(db.runAsync).toHaveBeenCalled();
    });
  });
});
