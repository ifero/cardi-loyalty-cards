import { act, render, screen } from '@testing-library/react-native';

import { changeAppLanguage } from '@/shared/i18n';
import { LIGHT_THEME } from '@/shared/theme/colors';

import { PaginationDots } from './PaginationDots';

jest.mock('@/shared/theme', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { LIGHT_THEME: theme } = require('@/shared/theme/colors');
  return { useTheme: () => ({ theme, isDark: false }) };
});

describe('PaginationDots', () => {
  it('renders one dot per page', () => {
    render(<PaginationDots total={3} current={1} />);

    expect(screen.getByTestId('pagination-dot-0')).toBeTruthy();
    expect(screen.getByTestId('pagination-dot-1')).toBeTruthy();
    expect(screen.getByTestId('pagination-dot-2')).toBeTruthy();
  });

  it('draws every dot 8 across, the shown page in primary and the rest in border', () => {
    render(<PaginationDots total={3} current={1} />);

    expect(screen.getByTestId('pagination-dot-1')).toHaveStyle({
      width: 8,
      height: 8,
      backgroundColor: LIGHT_THEME.primary
    });
    expect(screen.getByTestId('pagination-dot-0')).toHaveStyle({
      width: 8,
      height: 8,
      backgroundColor: LIGHT_THEME.border
    });
    expect(screen.getByTestId('pagination-dot-2')).toHaveStyle({
      backgroundColor: LIGHT_THEME.border
    });
  });

  it('sets the dots 8 apart', () => {
    render(<PaginationDots total={3} current={0} testID="dots" />);

    expect(screen.getByTestId('dots')).toHaveStyle({ gap: 8 });
  });

  it('is one element named by page, in the active language', () => {
    render(<PaginationDots total={3} current={1} testID="dots" />);

    const dots = screen.getByTestId('dots');
    expect(dots).toHaveProp('accessible', true);
    expect(dots).toHaveProp('accessibilityLabel', 'Page 2 of 3');
  });

  describe('in Italian', () => {
    afterEach(async () => {
      await act(async () => {
        await changeAppLanguage('en');
      });
    });

    it('is named by page in Italian', async () => {
      await act(async () => {
        await changeAppLanguage('it');
      });
      render(<PaginationDots total={3} current={1} testID="dots" />);

      expect(screen.getByTestId('dots')).toHaveProp('accessibilityLabel', 'Pagina 2 di 3');
    });
  });
});
