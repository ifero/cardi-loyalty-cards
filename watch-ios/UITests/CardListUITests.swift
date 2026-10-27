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

  /// Opens card 1's barcode and returns the screen's back chevron.
  ///
  /// The chevron, not `barcode-image`, is what proves the barcode screen is up: the screen's
  /// own `.accessibilityIdentifier("barcode-view")` propagates to its children and replaces
  /// their identifiers, so no element carries `barcode-image` (measured on a 40 mm watchOS 26.5
  /// simulator, before and after Story 23.2).
  private func openBarcode() throws -> (row: XCUIElement, back: XCUIElement) {
    let cards = [
      ["id": "1", "name": "Esselunga", "brandId": NSNull(), "colorHex": "#1e90ff", "barcodeValue": "5901234123457", "barcodeFormat": "EAN13"]
    ]
    let jsonData = try JSONSerialization.data(withJSONObject: cards, options: [])
    let json = String(data: jsonData, encoding: .utf8)!

    app.launchEnvironment["UITEST_CARDS"] = json
    app.launch()

    let firstRow = app.buttons["card-row-1"]
    XCTAssertTrue(firstRow.waitForExistence(timeout: 2))
    firstRow.tap()

    let back = app.navigationBars.buttons["BackButton"]
    XCTAssertTrue(back.waitForExistence(timeout: 2), "The barcode screen should open")
    return (firstRow, back)
  }

  func test_tapBarcode_keepsBarcode() throws {
    let (firstRow, back) = try openBarcode()

    // A tap no longer leaves the barcode (Story 23.2, decision 1): a stray touch while the
    // code is held to a scanner must not close it. Tapped in the middle of the white field.
    app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.6)).tap()

    XCTAssertFalse(back.waitForNonExistence(timeout: 1), "A tap must not dismiss the barcode")
    XCTAssertFalse(firstRow.exists && firstRow.isHittable)
  }

  func test_crownRotation_keepsBarcode() throws {
    let (firstRow, back) = try openBarcode()

    // The crown does nothing on the barcode screen (Story 23.2, watch grammar §8): it used to
    // dismiss on a single detent. Turn it both ways; the barcode stays.
    XCUIDevice.shared.rotateDigitalCrown(delta: 1.0)
    XCUIDevice.shared.rotateDigitalCrown(delta: -1.0)

    XCTAssertFalse(
      back.waitForNonExistence(timeout: 1), "The crown must not dismiss the barcode")
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
