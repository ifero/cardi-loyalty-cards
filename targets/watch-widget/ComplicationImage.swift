import ImageIO
import SwiftUI
import UIKit

/// Loads an asset-catalog image and downsamples it to a complication-safe size.
///
/// WidgetKit's complication archiver measures a raster image's *native* pixel
/// size and rejects anything over the per-family budget with
/// `WidgetArchiver.ArchivingError.imageTooLarge` — which renders the slot as a
/// grey placeholder. `.frame`/`.scaledToFit` only change layout, not the
/// archived bitmap, so the pixels themselves must be shrunk.
///
/// The budget is 76 px: `maxPoint` 38 × `scale` 2. It is the shipped value, and
/// it archives in all four families, `accessoryCorner` included, the tightest
/// of them; a larger image fails there first. Design to 76 px; do not raise it.
enum ComplicationImage {
  static func make(_ assetName: String, maxPoint: CGFloat = 38, scale: CGFloat = 2) -> Image? {
    guard
      let downsampled = UIImage(named: assetName)?.complicationDownsampled(maxPoint: maxPoint, scale: scale)
    else {
      return nil
    }
    return Image(uiImage: downsampled)
  }
}

private extension UIImage {
  /// Returns a copy whose longest edge is at most `maxPoint * scale` pixels,
  /// using ImageIO so the full-resolution bitmap is never fully decoded.
  func complicationDownsampled(maxPoint: CGFloat, scale: CGFloat) -> UIImage? {
    guard
      let data = pngData(),
      let source = CGImageSourceCreateWithData(data as CFData, nil)
    else {
      return self
    }

    let options: [CFString: Any] = [
      kCGImageSourceCreateThumbnailFromImageAlways: true,
      kCGImageSourceShouldCacheImmediately: true,
      kCGImageSourceCreateThumbnailWithTransform: true,
      kCGImageSourceThumbnailMaxPixelSize: maxPoint * scale,
    ]

    guard let thumbnail = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else {
      return self
    }

    return UIImage(cgImage: thumbnail, scale: scale, orientation: .up)
  }
}
