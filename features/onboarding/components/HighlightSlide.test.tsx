import { render, screen, within } from '@testing-library/react-native';
import React from 'react';
import { ScrollView, Text } from 'react-native';

import { LIGHT_THEME } from '@/shared/theme/colors';

import { HighlightSlide } from './HighlightSlide';

jest.mock('@/shared/theme', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { LIGHT_THEME: theme } = require('@/shared/theme/colors');
  return { useTheme: () => ({ theme, isDark: false }) };
});

describe('HighlightSlide', () => {
  it('renders the drawing, the title and the description', () => {
    render(
      <HighlightSlide
        title="All your cards in one place"
        description="Store every loyalty card digitally."
        illustration={<Text>Illustration</Text>}
      />
    );

    expect(screen.getByText('All your cards in one place')).toBeTruthy();
    expect(screen.getByText('Store every loyalty card digitally.')).toBeTruthy();
    expect(screen.getByText('Illustration')).toBeTruthy();
  });

  it('scrolls its page without bouncing, so nothing clips under large text', () => {
    render(
      <HighlightSlide
        title="t"
        description="d"
        illustration={<Text>I</Text>}
        testID="highlight-content"
      />
    );

    const page = screen.UNSAFE_getByType(ScrollView);
    expect(page.props.testID).toBe('highlight-content');
    expect(page.props.alwaysBounceVertical).toBe(false);
    expect(within(page).getByText('t')).toBeTruthy();
    expect(within(page).getByText('I')).toBeTruthy();
  });

  it('sets the drawing 96 down, the title 48 below it and the description 12 below that', () => {
    render(
      <HighlightSlide title="Title" description="Description" illustration={<Text>I</Text>} />
    );

    expect(screen.UNSAFE_getByType(ScrollView).props.contentContainerStyle).toMatchObject({
      paddingTop: 96,
      paddingHorizontal: 24,
      alignItems: 'center'
    });
    expect(screen.getByText('Title')).toHaveStyle({
      marginTop: 48,
      textAlign: 'center',
      color: LIGHT_THEME.textPrimary,
      fontSize: 24,
      fontWeight: '700'
    });
    expect(screen.getByText('Description')).toHaveStyle({
      marginTop: 12,
      maxWidth: 310,
      textAlign: 'center',
      color: LIGHT_THEME.textSecondary,
      fontSize: 15,
      fontWeight: '400'
    });
  });

  it('does not render the action, which the screen footer holds', () => {
    render(<HighlightSlide title="t" description="d" illustration={<Text>I</Text>} />);

    expect(screen.queryByTestId('highlight-next-button')).toBeNull();
  });
});
