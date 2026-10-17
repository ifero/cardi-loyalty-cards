/**
 * DataManagementSection — settings frame A's DATA (Story 22.7).
 *
 * Rendered through the real `StoryDecorator` and the real rows, because the spinners and the
 * chevrons are the shared row's.
 */
import { render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';
import { Svg } from 'react-native-svg';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { DataManagementSection } from './DataManagementSection';

type DataProps = React.ComponentProps<typeof DataManagementSection>;

const renderData = (props: Partial<DataProps> = {}) => {
  const handlers = { onExportPress: jest.fn(), onImportPress: jest.fn(), onSyncPress: jest.fn() };
  render(
    <StoryDecorator>
      <DataManagementSection
        isAuthenticated
        syncLabel="2 minutes ago"
        isSyncing={false}
        isPreparingImport={false}
        {...handlers}
        {...props}
      />
    </StoryDecorator>
  );
  return handlers;
};

const spinner = (row: string) => screen.queryByTestId(`${row}-spinner`);
/** Lucide hides its icons from assistive technology, so a query has to look past that. */
const chevron = (row: string) =>
  screen.queryByTestId(`${row}-chevron`, { includeHiddenElements: true });

describe('DataManagementSection (frame A)', () => {
  it('heads the group DATA', () => {
    renderData();
    expect(screen.getByRole('header', { name: 'Data' })).toBeTruthy();
  });

  it('orders Export Data, Import Data, then Sync', () => {
    renderData();
    const tree = JSON.stringify(screen.toJSON());
    const order = ['settings-export-row', 'settings-import-row', 'settings-sync-row'].map(
      (testID) => tree.indexOf(`"${testID}"`)
    );
    expect(order.every((index) => index > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  // Export keeps "JSON"; Import has none, as the frame draws it. Every row takes its chevron.
  it('shows JSON on Export only, and a chevron on every row', () => {
    renderData();
    expect(screen.getByTestId('settings-export-row').props.accessibilityLabel).toBe(
      'Export Data, JSON'
    );
    expect(screen.getByTestId('settings-import-row').props.accessibilityLabel).toBe('Import Data');
    expect(screen.getAllByText('JSON')).toHaveLength(1);
    expect(screen.UNSAFE_queryAllByType(Svg)).toHaveLength(3);
    ['settings-export-row', 'settings-import-row', 'settings-sync-row'].forEach((row) =>
      expect(chevron(row)).toBeTruthy()
    );
  });

  // The relative time, never the frame's "Synced", which is not real data.
  it('shows when Sync last ran, under its shipped label', () => {
    renderData();
    expect(screen.getByText('Sync')).toBeTruthy();
    expect(screen.getByTestId('settings-sync-row').props.accessibilityLabel).toBe(
      'Sync, 2 minutes ago'
    );
    expect(screen.queryByText('Sync Now')).toBeNull();
    expect(screen.queryByText('Synced')).toBeNull();
  });

  // Stories 7.7 and 13.6: a guest has no account to sync, and frame B is overruled.
  it('hides Sync from a guest', () => {
    renderData({ isAuthenticated: false });
    expect(screen.queryByTestId('settings-sync-row')).toBeNull();
    expect(screen.getByTestId('settings-export-row')).toBeTruthy();
    expect(screen.getByTestId('settings-import-row')).toBeTruthy();
  });

  it('spins the Import row while the picker prepares, and only it', () => {
    renderData({ isPreparingImport: true });
    expect(spinner('settings-import-row')).toBeTruthy();
    expect(chevron('settings-import-row')).toBeNull();
    expect(spinner('settings-sync-row')).toBeNull();
    expect(chevron('settings-sync-row')).toBeTruthy();
  });

  it('spins the Sync row while it syncs, and only it', () => {
    renderData({ isSyncing: true });
    expect(spinner('settings-sync-row')).toBeTruthy();
    expect(chevron('settings-sync-row')).toBeNull();
    expect(spinner('settings-import-row')).toBeNull();
  });

  it('spins nothing at rest', () => {
    renderData();
    ['settings-export-row', 'settings-import-row', 'settings-sync-row'].forEach((row) =>
      expect(spinner(row)).toBeNull()
    );
  });

  it('fires each row’s own handler', async () => {
    const { onExportPress, onImportPress, onSyncPress } = renderData();

    await userEvent.press(screen.getByTestId('settings-export-row'));
    expect(onExportPress).toHaveBeenCalledTimes(1);
    await userEvent.press(screen.getByTestId('settings-import-row'));
    expect(onImportPress).toHaveBeenCalledTimes(1);
    await userEvent.press(screen.getByTestId('settings-sync-row'));
    expect(onSyncPress).toHaveBeenCalledTimes(1);
  });

  // Busy, not disabled: a second press while the picker prepares does nothing.
  it('ignores a press on Import while the picker prepares', async () => {
    const { onImportPress } = renderData({ isPreparingImport: true });
    await userEvent.press(screen.getByTestId('settings-import-row'));
    expect(onImportPress).not.toHaveBeenCalled();
    expect(screen.getByTestId('settings-import-row').props.accessibilityState).toEqual({
      disabled: false,
      busy: true
    });
  });
});
