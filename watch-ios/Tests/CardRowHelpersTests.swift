import XCTest
@testable import MyLoyaltyCardsWatch

final class CardRowHelpersTests: XCTestCase {

  // MARK: - initials(from:)

  func test_initials_twoWords() throws {
    XCTAssertEqual(initials(from: "Local Bakery"), "LB")
  }

  func test_initials_singleWord() throws {
    XCTAssertEqual(initials(from: "Esselunga"), "ES")
  }

  func test_initials_empty() throws {
    XCTAssertEqual(initials(from: ""), "")
  }

  func test_initials_threeWords() throws {
    XCTAssertEqual(initials(from: "New York Bakery"), "NY")
  }

  func test_initials_whitespace() throws {
    XCTAssertEqual(initials(from: "  "), "")
  }

  // MARK: - mapColor(hex:)

  func test_mapColor_knownHex_returnsColor() throws {
    XCTAssertNotNil(mapColor(hex: "#1e90ff"))
    XCTAssertNotNil(mapColor(hex: "green"))
  }

  func test_mapColor_nil_returnsNil() throws {
    XCTAssertNil(mapColor(hex: nil))
  }

  func test_mapColor_empty_returnsNil() throws {
    XCTAssertNil(mapColor(hex: ""))
    XCTAssertNil(mapColor(hex: "   "))
  }

  func test_mapColor_namedColors() throws {
    XCTAssertNotNil(mapColor(hex: "blue"))
    XCTAssertNotNil(mapColor(hex: "red"))
    XCTAssertNotNil(mapColor(hex: "green"))
    XCTAssertNotNil(mapColor(hex: "orange"))
    XCTAssertNotNil(mapColor(hex: "gray"))
    XCTAssertNotNil(mapColor(hex: "grey"))
  }

  func test_mapColor_arbitraryHex_returnsColor() throws {
    // Arbitrary hex that's not in the named set
    XCTAssertNotNil(mapColor(hex: "#ff4d4d"))
    XCTAssertNotNil(mapColor(hex: "#ffb24d"))
    XCTAssertNotNil(mapColor(hex: "#1C1C1F"))
    XCTAssertNotNil(mapColor(hex: "AABBCC"))
  }

  func test_mapColor_invalidHex_returnsFallback() throws {
    // Invalid hex should still return a fallback Color: the azure `defaultCardAccent` (Story 23.2)
    XCTAssertNotNil(mapColor(hex: "#badhex"))
    XCTAssertNotNil(mapColor(hex: "xyz"))
  }

  // MARK: - parseHexColor(_:)

  func test_parseHexColor_validWithHash() throws {
    // Should not return the azure fallback for valid hex
    let color = parseHexColor("#FF0000")
    XCTAssertNotNil(color) // pure red
  }

  func test_parseHexColor_validWithoutHash() throws {
    let color = parseHexColor("00FF00")
    XCTAssertNotNil(color) // pure green
  }

  func test_parseHexColor_invalidReturnsFallback() throws {
    // Invalid input returns the azure `defaultCardAccent` fallback (Story 23.2)
    let _ = parseHexColor("invalid")
    // Can't easily compare SwiftUI Color, but we verify it doesn't crash
  }

  func test_parseHexColor_tooShort() throws {
    let _ = parseHexColor("#FFF") // 3-digit not supported → azure fallback
  }

  func test_parseHexColor_black() throws {
    let _ = parseHexColor("#000000")
    // Verify it doesn't crash for pure black
  }

  func test_parseHexColor_white() throws {
    let _ = parseHexColor("#FFFFFF")
    // Verify it doesn't crash for pure white
  }

  // MARK: - relativeLuminance(hex:)

  func test_luminance_black() throws {
    let lum = relativeLuminance(hex: "#000000")
    XCTAssertEqual(lum, 0.0, accuracy: 0.001)
  }

  func test_luminance_white() throws {
    let lum = relativeLuminance(hex: "#FFFFFF")
    XCTAssertEqual(lum, 1.0, accuracy: 0.001)
  }

  func test_luminance_midGray() throws {
    let lum = relativeLuminance(hex: "#808080")
    // Mid gray should be roughly 0.216
    XCTAssertGreaterThan(lum, 0.1)
    XCTAssertLessThan(lum, 0.4)
  }

  func test_luminance_invalidHex() throws {
    let lum = relativeLuminance(hex: "invalid")
    XCTAssertEqual(lum, 0.0, accuracy: 0.001) // defaults to dark
  }

  // MARK: - shouldUseWhiteText(onBackgroundHex:)

  func test_whiteText_onDarkBackground() throws {
    XCTAssertTrue(shouldUseWhiteText(onBackgroundHex: "#000000"))
    XCTAssertTrue(shouldUseWhiteText(onBackgroundHex: "#1C1C1F"))
    XCTAssertTrue(shouldUseWhiteText(onBackgroundHex: "#333333"))
  }

  func test_blackText_onLightBackground() throws {
    XCTAssertFalse(shouldUseWhiteText(onBackgroundHex: "#FFFFFF"))
    XCTAssertFalse(shouldUseWhiteText(onBackgroundHex: "#FFFF00"))
  }

  // MARK: - isNearBlack(hex:)

  func test_nearBlack_pureBlack() throws {
    XCTAssertTrue(isNearBlack(hex: "#000000"))
  }

  func test_nearBlack_veryDark() throws {
    XCTAssertTrue(isNearBlack(hex: "#0A0A0A"))
    XCTAssertTrue(isNearBlack(hex: "#111111"))
  }

  func test_notNearBlack_brightColor() throws {
    XCTAssertFalse(isNearBlack(hex: "#FF0000"))
    XCTAssertFalse(isNearBlack(hex: "#FFFFFF"))
    XCTAssertFalse(isNearBlack(hex: "#808080"))
  }

  // MARK: - Sort Order (WatchCard sorting)

  func test_sortByUsageCount_descending() throws {
    let cards = [
      WatchCard(id: "1", name: "Low", brandId: nil, colorHex: nil, barcodeValue: nil, barcodeFormat: nil, usageCount: 1, lastUsedAt: nil, createdAt: Date()),
      WatchCard(id: "2", name: "High", brandId: nil, colorHex: nil, barcodeValue: nil, barcodeFormat: nil, usageCount: 10, lastUsedAt: nil, createdAt: Date()),
      WatchCard(id: "3", name: "Mid", brandId: nil, colorHex: nil, barcodeValue: nil, barcodeFormat: nil, usageCount: 5, lastUsedAt: nil, createdAt: Date()),
    ]
    let sorted = WatchCard.sortedForDisplay(cards)
    XCTAssertEqual(sorted.map(\.name), ["High", "Mid", "Low"])
  }

  func test_sortByLastUsedAt_whenUsageCountEqual() throws {
    let now = Date()
    let earlier = now.addingTimeInterval(-3600)
    let cards = [
      WatchCard(id: "1", name: "Earlier", brandId: nil, colorHex: nil, barcodeValue: nil, barcodeFormat: nil, usageCount: 5, lastUsedAt: earlier, createdAt: now),
      WatchCard(id: "2", name: "Later", brandId: nil, colorHex: nil, barcodeValue: nil, barcodeFormat: nil, usageCount: 5, lastUsedAt: now, createdAt: earlier),
    ]
    let sorted = WatchCard.sortedForDisplay(cards)
    XCTAssertEqual(sorted.map(\.name), ["Later", "Earlier"])
  }

  func test_sortByCreatedAt_asFallback() throws {
    let now = Date()
    let earlier = now.addingTimeInterval(-3600)
    let cards = [
      WatchCard(id: "1", name: "Older", brandId: nil, colorHex: nil, barcodeValue: nil, barcodeFormat: nil, usageCount: 0, lastUsedAt: nil, createdAt: earlier),
      WatchCard(id: "2", name: "Newer", brandId: nil, colorHex: nil, barcodeValue: nil, barcodeFormat: nil, usageCount: 0, lastUsedAt: nil, createdAt: now),
    ]
    let sorted = WatchCard.sortedForDisplay(cards)
    XCTAssertEqual(sorted.map(\.name), ["Newer", "Older"])
  }

  // MARK: - Brand Identity Display

  func test_catalogueBrand_initialsFallback_derivesFromBrandName() throws {
    // Initials are the fallback for a catalogue brand with no bundled imageset
    // (Story 16.29); brands that ship artwork render the logo instead.
    let name = "Esselunga"
    XCTAssertEqual(initials(from: name), "ES")
  }

  func test_customCard_usesUserColor() throws {
    // Custom card with no brandId should fall back to mapColor from colorHex
    let color = mapColor(hex: "#ff4d4d")
    XCTAssertNotNil(color)
  }

  // MARK: - Brand logo resolution (Story 16.29 / AC2, AC3)
  //
  // BrandLogoCatalog is the generator-mirrored resolver shared with the watch
  // complication (targets/watch/Generated/BrandLogoCatalog.swift). These cover the
  // two fallback paths the card list depends on: an unknown brand must resolve to
  // nil so the row draws initials rather than an empty circle.

  func test_assetName_knownBrand_returnsImagesetName() throws {
    XCTAssertEqual(BrandLogoCatalog.assetName(for: "esselunga"), "BrandLogo-esselunga")
  }

  func test_assetName_normalizesCasingAndWhitespace() throws {
    // The row trims and lowercases brand ids before lookup; the resolver must agree.
    XCTAssertEqual(BrandLogoCatalog.assetName(for: "  Esselunga  "), "BrandLogo-esselunga")
  }

  func test_assetName_unknownBrand_returnsNil() throws {
    // A brand added to catalogue/italy.json with no bundled PNG lands here.
    XCTAssertNil(BrandLogoCatalog.assetName(for: "brand-with-no-artwork"))
  }

  func test_assetName_nilOrEmptyBrandId_returnsNil() throws {
    // Custom cards carry no brandId at all.
    XCTAssertNil(BrandLogoCatalog.assetName(for: nil))
    XCTAssertNil(BrandLogoCatalog.assetName(for: ""))
    XCTAssertNil(BrandLogoCatalog.assetName(for: "   "))
  }

  func test_prefersDarkBacking_lightLogo_isTrue() throws {
    // conad is classified light by the generator's luminance analysis, so it needs
    // a dark chip to stay visible on the row.
    XCTAssertTrue(BrandLogoCatalog.prefersDarkBacking(for: "conad"))
  }

  func test_prefersDarkBacking_normalLogo_isFalse() throws {
    XCTAssertFalse(BrandLogoCatalog.prefersDarkBacking(for: "esselunga"))
  }

  func test_prefersDarkBacking_unknownBrand_isFalse() throws {
    XCTAssertFalse(BrandLogoCatalog.prefersDarkBacking(for: "brand-with-no-artwork"))
    XCTAssertFalse(BrandLogoCatalog.prefersDarkBacking(for: nil))
  }

  // MARK: - Avatar logo inset (Story 16.29 / AC1)

  func test_avatarLogoInset_keepsArtworkInsideTheInscribedSquare() throws {
    let metrics = WatchCardRowLayoutMetrics.compact
    let usableSide = metrics.avatarSize - (metrics.avatarLogoInset * 2)

    // The avatar is clipped to a circle, so the widest artwork that cannot be
    // clipped spans the inscribed square: diameter / √2.
    XCTAssertEqual(usableSide, metrics.avatarSize / 2.0.squareRoot(), accuracy: 0.0001)
    XCTAssertLessThan(usableSide, metrics.avatarSize)
    XCTAssertGreaterThan(metrics.avatarLogoInset, 0)
  }

  // MARK: - Favourite badge accessibility (Story 9.4 / C3)

  func test_cardRowAccessibilityKey_favorite_usesFavouriteKey() throws {
    XCTAssertEqual(
      cardRowAccessibilityKey(isFavorite: true),
      "watch.card_row.favorite_accessibility_format")
  }

  func test_cardRowAccessibilityKey_nonFavorite_usesDefaultKey() throws {
    XCTAssertEqual(
      cardRowAccessibilityKey(isFavorite: false),
      "watch.card_row.accessibility_format")
  }
}
