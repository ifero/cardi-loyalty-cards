import fs from 'node:fs';
import path from 'node:path';

import { swiftDeclaration } from './swift-source-helpers';

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

/** `source` with its comments removed, so a quoted call in prose is not counted as code. */
const codeOnly = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');

/** The barcode view's per-appearance `.task(id: card.id) { … }`, brace-matched, code only. */
const taskBody = (barcodeView: string) =>
  swiftDeclaration(codeOnly(barcodeView), '.task(id: card.id) {', 'BarcodeFlashView.swift');

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
    const appearanceTask = taskBody(readSwift(barcodeViewPath));

    // Emission rides the per-appearance task — one event per card opened, or paged to and kept
    // on screen for the policy's delay (Story 23.2, decision 3; see the next test). The task is
    // sliced brace-matched (it used to be sliced to an anchor that did not exist, so the "slice"
    // ran to the end of the file).
    expect(appearanceTask).toContain('WatchSessionManager.shared.recordCardUsed(cardId: card.id)');
    expect(appearanceTask.split('recordCardUsed(').length - 1).toBe(1);
  });

  it('counts the opened card at once and a paged card only after it stays (Story 23.2, decision 3)', () => {
    const barcodeView = readSwift(barcodeViewPath);
    const appearanceTask = taskBody(barcodeView);

    // Pinned whole: `.success` plays for an OPEN only (the crown's own detent haptic marks a page);
    // the delay is the policy's, run in the layout suite's Swift harness (zero opened, one second
    // paged); the opened card skips the sleep and records at once, as before; a paged card records
    // only if its task survived the sleep AND its pager still shows it. `try?` swallows the
    // cancellation, and the cancellation itself comes late — the view outlives the crown's move by
    // its exit slide and the close by the pop (measured: a card paged away after 5.4 s of an 8 s
    // delay still recorded, mid-exit) — so the on-screen check is what keeps a card the crown moved
    // on from, or a screen closed within the second, from counting.
    expect(appearanceTask.replace(/\s+/g, ' ').trim()).toBe(
      '.task(id: card.id) { if arrival == .opened { WKInterfaceDevice.current().play(.success) } ' +
        'let usageDelay = WatchBarcodePaging.usageDelay(for: arrival) if usageDelay > .zero { ' +
        'try? await Task.sleep(for: usageDelay) if Task.isCancelled || !isStillOnScreen { return } } ' +
        'WatchSessionManager.shared.recordCardUsed(cardId: card.id) }'
    );
    expect(codeOnly(barcodeView)).toContain(
      '@Environment(\\.barcodeOnScreen) private var onScreen'
    );
    expect(
      swiftDeclaration(
        codeOnly(barcodeView),
        'private var isStillOnScreen: Bool {',
        'BarcodeFlashView.swift'
      )
        .replace(/\s+/g, ' ')
        .trim()
    ).toBe('private var isStillOnScreen: Bool { onScreen.map { $0.cardId == card.id } ?? true }');

    // The task stays keyed by the card alone, so a card's arrival changing under it cannot re-run
    // it, and the haptic is played nowhere else in the view.
    expect(codeOnly(barcodeView).split('.task(id: card.id)').length - 1).toBe(1);
    expect(codeOnly(barcodeView).split('.play(').length - 1).toBe(1);
  });

  it('records usage from the barcode view alone — the pager pages, and counts nothing itself', () => {
    // One emitter in the whole watch app, so the paging host cannot add a second event (or an
    // early one) for a card the crown merely passed.
    const emitters = listSwiftSources(watchDir)
      .filter((filePath) => filePath !== sessionManagerPath)
      .filter((filePath) => codeOnly(readSwift(filePath)).includes('recordCardUsed('))
      .map((filePath) => path.basename(filePath));

    expect(emitters).toEqual(['BarcodeFlashView.swift']);

    const pagerCode = codeOnly(readSwift(path.join(watchDir, 'BarcodePagerView.swift')));

    expect(pagerCode).not.toContain('WKInterfaceDevice');
    expect(pagerCode).not.toContain('.play(');
  });

  it('moves the on-screen card on the instant the crown does, and clears it as the screen closes', () => {
    // What a paged card's usage task reads after its delay (decision 3). The pager hands every card
    // it shows the same reference, starts it on the opened card, moves it BEFORE the slide begins,
    // and clears it when the screen starts to close and again when it has gone.
    const pagerCode = codeOnly(readSwift(path.join(watchDir, 'BarcodePagerView.swift')));
    const pager = (signature: string) =>
      swiftDeclaration(pagerCode, signature, 'BarcodePagerView.swift').replace(/\s+/g, ' ').trim();

    // A REFERENCE, not a value: a card the crown leaves is frozen for its exit slide with the
    // environment it last rendered, so only a shared object can tell it the crown has moved on. As
    // a struct, its copy would still name it, and it would count early.
    expect(pagerCode).toContain('final class WatchBarcodeOnScreen {');
    expect(pagerCode).not.toMatch(/\bstruct WatchBarcodeOnScreen\b/);
    expect(pagerCode).toContain(
      '_onScreen = State(initialValue: WatchBarcodeOnScreen(cardId: openedCardId))'
    );
    expect(pagerCode).toContain('.environment(\\.barcodeOnScreen, onScreen)');
    expect(pager('private func showCardAtDetent() {')).toContain(
      'onScreen.cardId = target withAnimation(.easeInOut(duration: 0.25)) {'
    );
    expect(pagerCode).toMatch(
      /\.onChange\(of: isPresented\) \{ _, presented in\s*if !presented \{\s*onScreen\.cardId = nil\s*\}\s*\}/
    );
    expect(pagerCode).toMatch(/\.onDisappear \{\s*onScreen\.cardId = nil\s*\}/);
    expect(pagerCode.split('onScreen.cardId =').length - 1).toBe(3);
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
