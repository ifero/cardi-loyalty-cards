import fs from 'node:fs';
import path from 'node:path';

/**
 * Story 9.6 — Count Card Opens on the Watch (ADR-2026-06-09-001).
 *
 * Contract tests pinning the watch-side CARD_USED usage-event emission:
 *   - message shape `{ version: 1, type: "CARD_USED", payload: { id, usedAt } }`
 *   - `usedAt` at millisecond precision (`.withFractionalSeconds`) — required
 *     for dedup-id correctness ("<cardId>:<usedAt>")
 *   - transport is `transferUserInfo` (OS-queued, survives unreachability and
 *     relaunch — AC3), NOT reachability-gated `sendMessage`
 *   - events recorded before WCSession activation are buffered and flushed on
 *     activation
 *   - the watch stays read-only for card DATA (AC4): the only outbound
 *     messages are `requestCards` and `CARD_USED`
 */

const repoRoot = path.resolve(__dirname, '../../..');
const watchDir = path.join(repoRoot, 'targets', 'watch');
const sessionManagerPath = path.join(watchDir, 'WatchSessionManager.swift');
const barcodeViewPath = path.join(watchDir, 'BarcodeFlashView.swift');

const readSwift = (filePath: string) => fs.readFileSync(filePath, 'utf8');

const listSwiftSources = (dir: string): string[] => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listSwiftSources(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.swift')) {
      files.push(fullPath);
    }
  }
  return files;
};

describe('watch usage event contract (Story 9.6)', () => {
  it('builds CARD_USED with the ADR v1 message shape', () => {
    const sessionManager = readSwift(sessionManagerPath);

    const builderStart = sessionManager.indexOf('func makeCardUsedEvent');
    expect(builderStart).toBeGreaterThan(-1);
    const builder = sessionManager.slice(builderStart, builderStart + 600);

    expect(builder).toContain('"version": 1');
    expect(builder).toContain('"type": "CARD_USED"');
    expect(builder).toContain('"id": cardId');
    expect(builder).toContain('"usedAt": usedAt');
  });

  it('stamps usedAt at millisecond precision in UTC (ISO-8601)', () => {
    const sessionManager = readSwift(sessionManagerPath);

    expect(sessionManager).toContain('ISO8601DateFormatter');
    expect(sessionManager).toContain('.withFractionalSeconds');
    expect(sessionManager).toContain('.withInternetDateTime');
  });

  it('uses the OS-queued transferUserInfo transport for usage events (AC3)', () => {
    const sessionManager = readSwift(sessionManagerPath);

    expect(sessionManager).toContain('.transferUserInfo(');
    // The reachability-gated one-shot channel must not carry usage events.
    expect(sessionManager).not.toMatch(/sendMessage\([^)]*CARD_USED/s);
  });

  it('buffers events until WCSession activation completes, then flushes', () => {
    const sessionManager = readSwift(sessionManagerPath);

    expect(sessionManager).toContain('pendingUsageEvents');
    expect(sessionManager).toContain('flushPendingUsageEvents');
    // Flush must be wired into the activation callback so pre-activation
    // opens (e.g. cold launch straight into a card) are not dropped.
    const activationCallback = sessionManager.slice(
      sessionManager.indexOf('activationDidCompleteWith'),
      sessionManager.indexOf('didReceiveApplicationContext')
    );
    expect(activationCallback).toContain('flushPendingUsageEvents');
  });

  it('records a usage event when the barcode view is displayed (AC1)', () => {
    const barcodeView = readSwift(barcodeViewPath);

    // Emission rides the same per-appearance task that plays the haptic — one
    // event per card open.
    expect(barcodeView).toContain('recordCardUsed(cardId: card.id)');
    const appearanceTask = barcodeView.slice(
      barcodeView.indexOf('.task(id: card.id)'),
      barcodeView.indexOf('.task(id: "\\(card.id)')
    );
    expect(appearanceTask).toContain('recordCardUsed');
  });

  it('keeps the watch read-only for card data — no outbound mutation messages (AC4)', () => {
    const sourcesByFile = listSwiftSources(watchDir).map((filePath) => ({
      filePath,
      source: readSwift(filePath)
    }));

    // transferUserInfo is invoked from exactly one call site, in the session
    // manager, and only ever carries the CARD_USED event built by
    // makeCardUsedEvent.
    for (const { filePath, source } of sourcesByFile) {
      if (filePath !== sessionManagerPath) {
        expect(source).not.toContain('transferUserInfo(');
      }
    }
    const sessionManager = readSwift(sessionManagerPath);
    const transferCallSites = sessionManager.match(/\.transferUserInfo\(/g) ?? [];
    expect(transferCallSites).toHaveLength(1);
    const transferFuncDecl = 'func transferUsageEvent';
    const funcStart = sessionManager.indexOf(transferFuncDecl);
    const callSite = sessionManager.indexOf('.transferUserInfo(');
    expect(funcStart).toBeGreaterThan(-1);
    expect(callSite).toBeGreaterThan(funcStart);
    // No other function opens between the declaration and the call — the
    // single call site lives inside transferUsageEvent.
    const betweenDeclAndCall = sessionManager.slice(funcStart + transferFuncDecl.length, callSite);
    expect(betweenDeclAndCall).not.toContain('func ');

    // Every inline sendMessage literal stays a read-only control ping.
    const allSources = sourcesByFile.map(({ source }) => source).join('\n');
    const sentMessageTypes = new Set(
      [...allSources.matchAll(/sendMessage\(\s*\[\s*"type":\s*"([^"]+)"/g)].map((match) => match[1])
    );
    expect([...sentMessageTypes]).toEqual(['requestCards']);

    // No card-data mutation verbs travel watch → phone.
    for (const forbidden of [
      'createCard',
      'editCard',
      'updateCard',
      'deleteCard',
      'syncCard',
      'toggleFavorite'
    ]) {
      expect(allSources).not.toMatch(
        new RegExp(`(?:sendMessage|transferUserInfo)\\([^)]*${forbidden}`, 's')
      );
    }
  });
});
