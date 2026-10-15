/**
 * Cards Feature Module
 * Story 2.1: Display Card List
 * Story 2.2: Add Card Manually
 * Story 2.3: Scan Barcode with Camera
 * Story 2.4: Display Virtual Logo
 * Story 2.5: Display Barcode (Barcode Flash)
 * Story 2.6: View Card Details
 * Story 2.7: Edit Card
 * Story 2.8: Delete Card
 * Story 3.2: Browse Catalogue Grid
 * Story 3.4: Cache Catalogue for Offline
 * Story 13.2: Restyle Home Screen
 * Story 13.3: Restyle Card Detail Screen
 *
 * Exports card-related components, hooks, and repositories.
 */

// Screens
export { default as HomeScreen } from './screens/HomeScreen';
export { default as CardDetailScreen } from './screens/CardDetailScreen';
export { default as CardEditScreen } from './screens/CardEditScreen';
export { default as BarcodeScreen } from './screens/BarcodeScreen';

// Components
export { CardList } from './components/CardList';
export { CardTile } from './components/CardTile';
export { EmptyState } from './components/EmptyState';
export { CardForm } from './components/CardForm';
export type { CardFormInput } from './components/CardForm';
export { FormatPicker } from './components/FormatPicker';
export { BarcodeScanner } from './components/BarcodeScanner';
export { VirtualLogo } from './components/VirtualLogo';
export { BarcodeRenderer } from './components/BarcodeRenderer';
export type { BarcodeRendererProps } from './components/BarcodeRenderer';
export { BarcodeFlash } from './components/BarcodeFlash';
export type { BarcodeFlashProps } from './components/BarcodeFlash';
export { CardDetails } from './components/CardDetails';
export { DetailRow } from './components/DetailRow';
export { BrandHero } from './components/BrandHero';
export { CatalogueGrid } from './components/CatalogueGrid';
export { SearchBar } from './components/SearchBar';
export { SortFilterRow } from './components/SortFilterRow';

// Hooks
export { useCards } from './hooks/useCards';
export { useAddCard } from './hooks/useAddCard';
export type { AddCardInput } from './hooks/useAddCard';
export { useEditCard } from './hooks/useEditCard';
export type { EditCardInput } from './hooks/useEditCard';
export { useDeleteCard } from './hooks/useDeleteCard';
export type { UseDeleteCardReturn } from './hooks/useDeleteCard';
export { useBarcodeScanner } from './hooks/useBarcodeScanner';
export type { ScanResult } from './hooks/useBarcodeScanner';
export { useBrightness } from './hooks/useBrightness';
export { useCardBrightnessBoost } from './hooks/useCardBrightnessBoost';
export type { UseBrightnessReturn } from './hooks/useBrightness';
export { useBrandLogo } from './hooks/useBrandLogo';
export { useCardSearch } from './hooks/useCardSearch';
export { useCardSort } from './hooks/useCardSort';
export type { SortOption } from './hooks/useCardSort';
export { useTrackCardUsage } from './hooks/useTrackCardUsage';
export { useToggleFavorite } from './hooks/useToggleFavorite';
export type { UseToggleFavoriteReturn } from './hooks/useToggleFavorite';

// Repositories
export { CatalogueRepository, catalogueRepository } from './repositories/catalogue-repository';

// Utils
export { generateInitials } from './utils/initials';
