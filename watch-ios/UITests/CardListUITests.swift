import XCTest

final class CardListUITests: XCTestCase {
  let app = XCUIApplication()

  override func setUpWithError() throws {
    continueAfterFailure = false
  }

  func test_emptyState_showsMessage() throws {
    app.launchEnvironment["UITEST_CARDS"] = "[]"
    app.launch()

    let emptyText = app.staticTexts["No cards yet"]
    XCTAssertTrue(emptyText.waitForExistence(timeout: 2), "Empty state message should appear")
  }

  func test_list_showsCards_and_supportsScrolling() throws {
    // Eight rows at a 52 pt pitch overflow even the tallest watch, so the last one starts below
    // the fold and only a scroll can bring it up (A-Z order, no favourites: Card H is last).
    let cards = (1...8).map { index -> [String: Any] in
      let letter = String(UnicodeScalar(UInt8(64 + index)))
      return ["id": "\(index)", "name": "Card \(letter)", "brandId": NSNull(), "colorHex": "green"]
    }
    let jsonData = try JSONSerialization.data(withJSONObject: cards, options: [])
    let json = String(data: jsonData, encoding: .utf8)!

    app.launchEnvironment["UITEST_CARDS"] = json
    // The order above is A-Z's, and the sort mode persists in the simulator's defaults: pin it.
    app.launchArguments = ["-watch.sortMode", "az"]
    app.launch()

    // Verify first card visible (by text and accessibility identifier)
    let first = app.staticTexts["Card A"]
    XCTAssertTrue(first.waitForExistence(timeout: 2))

    let firstRow = app.buttons["card-row-1"]
    XCTAssertTrue(firstRow.waitForExistence(timeout: 2), "Row identifier should be present")

    let lastRow = app.buttons["card-row-8"]
    XCTAssertFalse(lastRow.exists && lastRow.isHittable, "The last row should start off screen")

    // Scroll with the Digital Crown, which the list takes explicitly (Story 23.2, watch grammar
    // §8). `XCUIRemote` is the tvOS remote and has no rotation; the crown is `XCUIDevice`'s.
    XCUIDevice.shared.rotateDigitalCrown(delta: 5.0)

    waitUntilHittable(lastRow, "The crown should scroll the last row into reach")
  }

  /// Waits for `element` to exist AND be hittable. `waitForExistence` alone returns at once for
  /// an element that already exists off screen, or under a pushed screen mid-pop.
  private func waitUntilHittable(
    _ element: XCUIElement, _ message: String, file: StaticString = #filePath, line: UInt = #line
  ) {
    let hittable = XCTNSPredicateExpectation(
      predicate: NSPredicate(format: "exists == true AND hittable == true"), object: element)
    XCTAssertEqual(
      XCTWaiter().wait(for: [hittable], timeout: 3), .completed, message, file: file, line: line)
  }

  func test_importSampleCards_buttonAddsCards() throws {
    // Start with empty state so the debug import is visible
    app.launchEnvironment["UITEST_CARDS"] = "[]"
    app.launch()

    let importButton = app.buttons["import-sample-cards"]
    XCTAssertTrue(
      importButton.waitForExistence(timeout: 2), "Import button should be visible in DEBUG")

    importButton.tap()

    // Imported sample should appear
    let first = app.staticTexts["Esselunga"]
    XCTAssertTrue(first.waitForExistence(timeout: 2))
  }

  func test_tapCard_displaysBarcode() throws {
    let cards = [
      [
        "id": "1", "name": "Esselunga", "brandId": NSNull(), "colorHex": "#1e90ff",
        "barcodeValue": "5901234123457", "barcodeFormat": "EAN13",
      ]
    ]
    let jsonData = try JSONSerialization.data(withJSONObject: cards, options: [])
    let json = String(data: jsonData, encoding: .utf8)!

    app.launchEnvironment["UITEST_CARDS"] = json
    app.launch()

    let firstRow = app.buttons["card-row-1"]
    XCTAssertTrue(firstRow.waitForExistence(timeout: 2))
    firstRow.tap()

    let barcodeView = app.otherElements["barcode-view"]
    // Enforce latency target: barcode must appear within 1s
    XCTAssertTrue(barcodeView.waitForExistence(timeout: 1))
    let cardTitle = app.staticTexts["Esselunga"]
    XCTAssertTrue(cardTitle.waitForExistence(timeout: 1))

    // Barcode image should be present (generated from card data)
    let barcodeImage = app.images["barcode-image"]
    XCTAssertTrue(barcodeImage.waitForExistence(timeout: 1))
  }

  /// One crown detent on the barcode screen, which pages at low sensitivity: a rotation of 0.2
  /// moves one card and 0.1 none (measured on a 40 mm watchOS 26.5 simulator, Story 23.2).
  private let oneDetent: CGFloat = 0.2

  /// Three cards that sort A, B, C under A-Z, each with a barcode every encoder accepts.
  private let threeCards: [[String: Any]] = ["A", "B", "C"].enumerated().map { index, letter in
    [
      "id": "\(index + 1)", "name": "Card \(letter)", "brandId": NSNull(), "colorHex": "green",
      "barcodeValue": "5901234123457", "barcodeFormat": "EAN13",
    ]
  }

  /// Opens card `id`'s barcode and returns its row and the screen's back chevron.
  ///
  /// The chevron, not `barcode-image`, is what proves the barcode screen is up: the screen's
  /// own `.accessibilityIdentifier("barcode-view")` propagates to its children and replaces
  /// their identifiers, so no element carries `barcode-image` (measured on a 40 mm watchOS 26.5
  /// simulator, before and after Story 23.2).
  private func openBarcode(
    cards: [[String: Any]]? = nil, id: String = "1"
  ) throws -> (row: XCUIElement, back: XCUIElement) {
    let cards =
      cards ?? [
        ["id": "1", "name": "Esselunga", "brandId": NSNull(), "colorHex": "#1e90ff", "barcodeValue": "5901234123457", "barcodeFormat": "EAN13"]
      ]
    let jsonData = try JSONSerialization.data(withJSONObject: cards, options: [])
    let json = String(data: jsonData, encoding: .utf8)!

    app.launchEnvironment["UITEST_CARDS"] = json
    // The crown pages in the list's order, and the sort mode persists in the simulator's
    // defaults between runs: pin A-Z.
    app.launchArguments = ["-watch.sortMode", "az"]
    app.launch()

    let row = app.buttons["card-row-\(id)"]
    XCTAssertTrue(row.waitForExistence(timeout: 2))
    row.tap()

    let back = app.navigationBars.buttons["BackButton"]
    XCTAssertTrue(back.waitForExistence(timeout: 2), "The barcode screen should open")
    return (row, back)
  }

  /// Asserts the barcode screen shows `name`: the card's name is the navigation bar's title, and
  /// the only one (no second card's title left over from the slide).
  private func assertShows(
    _ name: String, _ message: String, file: StaticString = #filePath, line: UInt = #line
  ) {
    XCTAssertTrue(
      app.navigationBars.staticTexts[name].waitForExistence(timeout: 2), message, file: file,
      line: line)
    XCTAssertEqual(
      app.navigationBars.staticTexts.allElementsBoundByIndex.map(\.label), [name], message,
      file: file, line: line)
  }

  func test_tapBarcode_keepsBarcode() throws {
    let (firstRow, back) = try openBarcode(cards: threeCards, id: "2")

    // A tap no longer leaves the barcode (Story 23.2, decision 1): a stray touch while the
    // code is held to a scanner must not close it — nor, with other cards to page to, change
    // the card (decision 2). Tapped in the middle of the white field.
    app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.6)).tap()

    XCTAssertFalse(back.waitForNonExistence(timeout: 1), "A tap must not dismiss the barcode")
    XCTAssertFalse(firstRow.exists && firstRow.isHittable)
    assertShows("Card B", "A tap must not change the card")

    // Nor does a swipe up or down across the code: only the crown pages.
    let low = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.8))
    let high = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.3))
    low.press(forDuration: 0.01, thenDragTo: high)
    high.press(forDuration: 0.01, thenDragTo: low)

    XCTAssertFalse(back.waitForNonExistence(timeout: 1), "A swipe must not dismiss the barcode")
    assertShows("Card B", "A swipe must not change the card")

    // Nor a fast swipe left or right that starts inside the screen: only the one from the very
    // left edge is the system's way back.
    let left = app.coordinate(withNormalizedOffset: CGVector(dx: 0.25, dy: 0.6))
    let right = app.coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.6))
    left.press(forDuration: 0.01, thenDragTo: right, withVelocity: .fast, thenHoldForDuration: 0)
    right.press(forDuration: 0.01, thenDragTo: left, withVelocity: .fast, thenHoldForDuration: 0)

    XCTAssertFalse(
      back.waitForNonExistence(timeout: 1), "A sideways swipe must not dismiss the barcode")
    assertShows("Card B", "A sideways swipe must not change the card")
  }

  func test_crown_pagesOnwardAndBack() throws {
    let (_, back) = try openBarcode(cards: threeCards, id: "2")
    assertShows("Card B", "The opened card's barcode should show")

    // The crown scrolls through the cards on the barcode screen, one per detent, in the list's
    // order (Story 23.2, decisions 2–4). It used to dismiss on a single detent.
    XCUIDevice.shared.rotateDigitalCrown(delta: oneDetent)
    assertShows("Card C", "One detent onward should show the next card")

    XCUIDevice.shared.rotateDigitalCrown(delta: -oneDetent)
    assertShows("Card B", "One detent back should show the previous card")

    XCUIDevice.shared.rotateDigitalCrown(delta: -oneDetent)
    assertShows("Card A", "One more detent back should show the first card")

    XCTAssertFalse(back.waitForNonExistence(timeout: 1), "The crown must not dismiss the barcode")
  }

  func test_crown_stopsAtTheLastCard() throws {
    let (_, back) = try openBarcode(cards: threeCards, id: "3")
    assertShows("Card C", "The last card's barcode should show")

    // Decision 4: no wrap past either end. A turn past the last card changes nothing.
    XCUIDevice.shared.rotateDigitalCrown(delta: oneDetent)
    XCUIDevice.shared.rotateDigitalCrown(delta: oneDetent)
    assertShows("Card C", "The crown must stop at the last card")
    XCTAssertFalse(back.waitForNonExistence(timeout: 1), "The crown must not dismiss the barcode")

    // And turned back, it still pages: the stop is an end, not a lock.
    XCUIDevice.shared.rotateDigitalCrown(delta: -oneDetent)
    assertShows("Card B", "One detent back from the last card should show the one before it")
  }

  func test_crown_withOneCard_changesNothing() throws {
    let (firstRow, back) = try openBarcode()
    assertShows("Esselunga", "The card's barcode should show")

    // With one reachable card the screen takes no crown at all: turned both ways, by much more
    // than a detent, the same barcode stays.
    XCUIDevice.shared.rotateDigitalCrown(delta: 1.0)
    XCUIDevice.shared.rotateDigitalCrown(delta: -1.0)

    XCTAssertFalse(
      back.waitForNonExistence(timeout: 1), "The crown must not dismiss the barcode")
    assertShows("Esselunga", "The crown must not change the only card")
    XCTAssertFalse(firstRow.exists && firstRow.isHittable)
  }

  func test_backChevron_returnsToList() throws {
    let (firstRow, back) = try openBarcode()

    // With the tap and the crown gone, the back chevron is one of the screen's two ways back.
    back.tap()

    waitUntilHittable(firstRow, "The back chevron should return to the list")
  }

  func test_edgeSwipe_returnsToList() throws {
    let (firstRow, _) = try openBarcode()

    // The other way back: the system swipe from the left edge. A fast drag from the very edge;
    // a slow one, or one started inside the screen, is read as a touch on the code.
    let edge = app.coordinate(withNormalizedOffset: CGVector(dx: 0.0, dy: 0.55))
    let across = app.coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.55))
    edge.press(forDuration: 0.01, thenDragTo: across, withVelocity: .fast, thenHoldForDuration: 0)

    waitUntilHittable(firstRow, "A swipe from the left edge should return to the list")
  }
}
