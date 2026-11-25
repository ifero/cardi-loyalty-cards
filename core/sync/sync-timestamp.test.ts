import AsyncStorage from '@react-native-async-storage/async-storage';

import { _LAST_CLOUD_SYNC_KEY } from './cloud-sync';
import {
  _CLOUD_SYNC_LAST_SYNC_AT_KEY,
  clearLastSyncAt,
  getLastSyncAt,
  setLastSyncAt
} from './sync-timestamp';

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe('getLastSyncAt', () => {
  it('returns null when never set (first use)', async () => {
    const result = await getLastSyncAt();
    expect(result).toBeNull();
  });

  it('returns the stored timestamp value', async () => {
    await AsyncStorage.setItem(_CLOUD_SYNC_LAST_SYNC_AT_KEY, '2026-03-20T10:00:00.000Z');
    const result = await getLastSyncAt();
    expect(result).toBe('2026-03-20T10:00:00.000Z');
  });
});

describe('setLastSyncAt', () => {
  it('stores the timestamp in AsyncStorage', async () => {
    await setLastSyncAt('2026-03-21T12:00:00.000Z');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      _CLOUD_SYNC_LAST_SYNC_AT_KEY,
      '2026-03-21T12:00:00.000Z'
    );
  });

  it('overwrites a previous value', async () => {
    await setLastSyncAt('2026-03-20T10:00:00.000Z');
    await setLastSyncAt('2026-03-21T12:00:00.000Z');
    const result = await getLastSyncAt();
    expect(result).toBe('2026-03-21T12:00:00.000Z');
  });
});

describe('clearLastSyncAt', () => {
  it('removes the timestamp from AsyncStorage', async () => {
    await setLastSyncAt('2026-03-20T10:00:00.000Z');
    await clearLastSyncAt();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(_CLOUD_SYNC_LAST_SYNC_AT_KEY);
  });

  // Story 16.45: the download cooldown must not throttle the first sync after signing back in.
  it('also removes the download cooldown timestamp', async () => {
    await AsyncStorage.setItem(_LAST_CLOUD_SYNC_KEY, String(Date.now()));
    await clearLastSyncAt();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(_LAST_CLOUD_SYNC_KEY);
    expect(await AsyncStorage.getItem(_LAST_CLOUD_SYNC_KEY)).toBeNull();
  });

  it('results in null after clearing', async () => {
    await setLastSyncAt('2026-03-20T10:00:00.000Z');
    await clearLastSyncAt();
    const result = await getLastSyncAt();
    expect(result).toBeNull();
  });
});

describe('persistence across reads', () => {
  it('value persists across multiple reads', async () => {
    await setLastSyncAt('2026-03-22T08:30:00.000Z');
    const read1 = await getLastSyncAt();
    const read2 = await getLastSyncAt();
    expect(read1).toBe('2026-03-22T08:30:00.000Z');
    expect(read2).toBe('2026-03-22T08:30:00.000Z');
  });
});

describe('logout → clear → re-login → full sync cycle', () => {
  it('clearing timestamp causes next read to return null (triggers full sync)', async () => {
    // Simulate: sync completed, timestamp set
    await setLastSyncAt('2026-03-22T08:30:00.000Z');
    expect(await getLastSyncAt()).toBe('2026-03-22T08:30:00.000Z');

    // Simulate: user logs out → clear
    await clearLastSyncAt();
    expect(await getLastSyncAt()).toBeNull();

    // Simulate: user re-logs in → null means full sync
    const lastSyncAt = await getLastSyncAt();
    expect(lastSyncAt).toBeNull(); // will trigger full sync
  });
});
