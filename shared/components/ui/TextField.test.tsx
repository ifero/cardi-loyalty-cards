import { fireEvent, render, screen } from '@testing-library/react-native';
import { createRef } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, type TextInput } from 'react-native';

import { LIGHT_THEME } from '@/shared/theme/colors';
import { TOUCH_TARGET } from '@/shared/theme/spacing';

import { FieldError, FieldLabel, TextField } from './TextField';

// AC4b — an ODD value on purpose, as in `Button.test`. With the real 48, a field that hardcoded 48
// would pass the height test; 47 exists nowhere else, so only a field that reads the token can.
jest.mock('@/shared/theme/spacing', () => ({
  ...jest.requireActual('@/shared/theme/spacing'),
  TOUCH_TARGET: { min: 47 }
}));

// TextField styles via Unistyles (react-native-unistyles/mocks resolves themed
// styles against the first-registered theme — `light`). So assertions use the
// real LIGHT_THEME tokens.
//
// Dark-mode limitation: the official Unistyles v3 mock always returns the first
// theme from useUnistyles()/StyleSheet.create — UnistylesRuntime.setTheme() is a
// no-op in the mock — so a useUnistyles()-based component cannot be unit-rendered
// in dark mode here. ThemeProvider.test.tsx asserts the engine is switched to
// dark AND that the token set flips; the on-device light/dark visual sweep (AC5)
// remains the authoritative regression gate for dark-token application.
const flattenStyle = (style: unknown) =>
  StyleSheet.flatten(style as never) as Record<string, unknown>;

describe('TextField', () => {
  it('renders label and value', () => {
    render(<TextField label="Name" value="Mario" onChangeText={jest.fn()} testID="field" />);

    expect(screen.getByText('Name')).toBeTruthy();
    expect(screen.getByDisplayValue('Mario')).toBeTruthy();
  });

  it('shows error message', () => {
    render(
      <TextField label="Email" value="" onChangeText={jest.fn()} error="Required" testID="field" />
    );

    expect(screen.getByTestId('field-error')).toBeTruthy();
    expect(screen.getByText('Required')).toBeTruthy();
  });

  it('calls onChangeText', () => {
    const onChangeText = jest.fn();
    render(<TextField label="Name" value="" onChangeText={onChangeText} testID="field" />);

    fireEvent.changeText(screen.getByTestId('field'), 'ABC');
    expect(onChangeText).toHaveBeenCalledWith('ABC');
  });

  it('applies focused border color on focus', () => {
    render(<TextField label="Name" value="" onChangeText={jest.fn()} testID="field" />);

    const input = screen.getByTestId('field');
    fireEvent(input, 'focus');
    expect(flattenStyle(input.props.style).borderColor).toBe(LIGHT_THEME.primary);
  });

  it('applies default border when filled but not focused', () => {
    render(<TextField label="Name" value="Mario" onChangeText={jest.fn()} testID="field" />);

    const input = screen.getByTestId('field');
    expect(flattenStyle(input.props.style).borderColor).toBe(LIGHT_THEME.border);
  });

  it('handles disabled state', () => {
    render(<TextField label="Name" value="" onChangeText={jest.fn()} disabled testID="field" />);

    const input = screen.getByTestId('field');
    expect(input.props.editable).toBe(false);
  });

  // Story 22.6 — the form frame's input is white on cream (ink on black in dark): `surface`, not
  // the raised `surfaceElevated` it was drawn on until then.
  it('fills the input with the surface role', () => {
    render(<TextField label="Name" value="" onChangeText={jest.fn()} testID="field" />);

    const input = screen.getByTestId('field');
    expect(flattenStyle(input.props.style).backgroundColor).toBe(LIGHT_THEME.surface);
    expect(LIGHT_THEME.surface).not.toBe(LIGHT_THEME.surfaceElevated);
  });

  // Story 22.6 — the frame's input: a 1pt outline, the error's included, and the value in ink.
  it.each([
    ['filled', undefined],
    ['in error', 'Required']
  ])('outlines the input 1pt and sets its value in ink, %s', (_state, error) => {
    render(
      <TextField label="Name" value="Mario" onChangeText={jest.fn()} error={error} testID="field" />
    );

    expect(flattenStyle(screen.getByTestId('field').props.style)).toMatchObject({
      borderWidth: 1,
      color: LIGHT_THEME.textPrimary
    });
  });

  it('outlines an error in the error role, over focus', () => {
    render(
      <TextField label="Name" value="" onChangeText={jest.fn()} error="Required" testID="field" />
    );

    const input = screen.getByTestId('field');
    fireEvent(input, 'focus');
    expect(flattenStyle(input.props.style).borderColor).toBe(LIGHT_THEME.error);
  });

  // Against the same field idle, the only things a state may add are counted here: a filled field
  // draws no success mark of any kind, and an invalid one no icon and no tint — only its message.
  describe('nothing drawn beyond the idiom', () => {
    const field = (props: { value?: string; error?: string } = {}) => (
      <TextField label="Name" value="" onChangeText={jest.fn()} testID="field" {...props} />
    );
    const hostElements = () =>
      screen.root.findAll((node: { type: unknown }) => typeof node.type === 'string').length;

    it('draws no success mark when filled, on the idle fill and outline', () => {
      const view = render(field());
      const idle = hostElements();

      view.rerender(field({ value: 'Mario' }));
      expect(hostElements()).toBe(idle);
      expect(flattenStyle(screen.getByTestId('field').props.style)).toMatchObject({
        backgroundColor: LIGHT_THEME.surface,
        borderColor: LIGHT_THEME.border
      });
    });

    it('adds only its message in error, with no icon and no tint', () => {
      const view = render(field());
      const idle = hostElements();

      view.rerender(field({ error: 'Required' }));
      expect(hostElements()).toBe(idle + 1);
      expect(screen.getByTestId('field-error')).toBeTruthy();
      expect(flattenStyle(screen.getByTestId('field').props.style).backgroundColor).toBe(
        LIGHT_THEME.surface
      );
    });
  });

  // The frame's placeholder is the muted `#55555F` — `textSecondary`, not the lighter tertiary.
  it('draws the placeholder in textSecondary', () => {
    render(
      <TextField
        label="Name"
        value=""
        placeholder="Enter store name"
        onChangeText={jest.fn()}
        testID="field"
      />
    );

    expect(screen.getByTestId('field').props.placeholderTextColor).toBe(LIGHT_THEME.textSecondary);
  });

  it('pads the input 16pt on both sides', () => {
    render(<TextField label="Name" value="" onChangeText={jest.fn()} testID="field" />);

    const style = flattenStyle(screen.getByTestId('field').props.style);
    expect(style.paddingLeft ?? style.paddingHorizontal).toBe(16);
    expect(style.paddingRight).toBe(16);
  });

  it('keeps 52pt on the side of a right adornment, for the control inside the box', () => {
    render(
      <TextField
        label="Password"
        value=""
        onChangeText={jest.fn()}
        rightAdornment={<Pressable testID="toggle" />}
        testID="field"
      />
    );

    expect(flattenStyle(screen.getByTestId('field').props.style).paddingRight).toBe(52);
  });

  it('sets the label 8pt above its control', () => {
    render(<TextField label="Name" value="" onChangeText={jest.fn()} testID="field" />);

    // The label row: the label's nearest ancestor laid out as a row.
    let labelRow = screen.getByText('Name').parent;
    while (labelRow && flattenStyle(labelRow.props.style)?.flexDirection !== 'row') {
      labelRow = labelRow.parent;
    }
    expect(flattenStyle(labelRow?.props.style).marginBottom).toBe(8);
  });

  it('applies the subtle background when disabled', () => {
    render(<TextField label="Name" value="" onChangeText={jest.fn()} disabled testID="field" />);

    const input = screen.getByTestId('field');
    expect(flattenStyle(input.props.style).backgroundColor).toBe(LIGHT_THEME.backgroundSubtle);
  });

  // Story 22.1, AC7 — "Form field labels are UPPERCASE — label-bold (Inter 13px, weight 600,
  // +0.02em tracking)". The tracking arrives in POINTS through the token (0.02em × 13 = 0.26pt):
  // a literal `letterSpacing: 0.02` would be ~13× too tight.
  it('sets the label in uppercase label-bold, tracked in points (AC7)', () => {
    render(<TextField label="Card name" value="" onChangeText={jest.fn()} testID="field" />);

    const label = screen.getByText('Card name');
    expect(flattenStyle(label.props.style)).toMatchObject({
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.26,
      textTransform: 'uppercase',
      color: LIGHT_THEME.textPrimary
    });
    // The capitals are a style: the string a screen reader receives stays sentence case.
    expect(label.props.children).toBe('Card name');
  });

  it('keeps placeholders, values and errors in sentence case (AC7)', () => {
    render(
      <TextField
        label="Card name"
        value="Mario"
        placeholder="Enter card name"
        onChangeText={jest.fn()}
        error="Card name is required"
        testID="field"
      />
    );

    expect(flattenStyle(screen.getByTestId('field').props.style).textTransform).toBeUndefined();
    expect(
      flattenStyle(screen.getByTestId('field-error').props.style).textTransform
    ).toBeUndefined();
  });

  // React 19: `ref` is a plain prop, so a form library can reach the input to focus it.
  it('forwards its ref to the underlying input', () => {
    const ref = createRef<TextInput>();
    render(<TextField ref={ref} label="Name" value="" onChangeText={jest.fn()} testID="field" />);

    expect(ref.current).not.toBeNull();
    expect(typeof ref.current?.focus).toBe('function');
  });

  it('caps the input at maxLength and can show the count beside the label', () => {
    const { rerender } = render(
      <TextField
        label="Name"
        value=""
        maxLength={50}
        showCharacterCount
        onChangeText={jest.fn()}
        testID="field"
      />
    );

    expect(screen.getByTestId('field').props.maxLength).toBe(50);
    expect(screen.getByText('0/50')).toBeTruthy();

    rerender(
      <TextField
        label="Name"
        value="Test Card"
        maxLength={50}
        showCharacterCount
        onChangeText={jest.fn()}
        testID="field"
      />
    );
    expect(screen.getByText('9/50')).toBeTruthy();
  });

  // The device check: at the largest text size "CARD NAME" and "17/50" outgrew one line, and the
  // unwrapping row ran the count 35pt off the screen, touching the label. Jest lays nothing out,
  // so this pins the mechanism: a row that wraps, 8pt between the two, and a count that holds the
  // row's end on whichever line it lands — one line, as before, whenever both fit.
  it('wraps a count that cannot share the label’s line, 8pt clear of it and at the row’s end', () => {
    render(
      <TextField
        label="Card name"
        value="Test Card"
        maxLength={50}
        showCharacterCount
        onChangeText={jest.fn()}
        testID="field"
      />
    );

    const count = screen.getByText('9/50');
    let labelRow = count.parent;
    while (labelRow && flattenStyle(labelRow.props.style)?.flexDirection !== 'row') {
      labelRow = labelRow.parent;
    }
    expect(flattenStyle(labelRow?.props.style)).toMatchObject({
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'space-between',
      alignItems: 'center'
    });
    expect(flattenStyle(count.props.style).marginStart).toBe('auto');
  });

  it('shows no count unless asked', () => {
    render(
      <TextField label="Name" value="" maxLength={50} onChangeText={jest.fn()} testID="field" />
    );
    expect(screen.queryByText('0/50')).toBeNull();
  });

  // Story 21.6 handed this over: the frames set card numbers in JetBrains Mono so the digits
  // align, and the add and edit flows must agree.
  it('sets a mono field’s value in the mono-code face', () => {
    render(
      <TextField
        label="Card number"
        value="2000012345678"
        onChangeText={jest.fn()}
        mono
        testID="field"
      />
    );
    expect(flattenStyle(screen.getByTestId('field').props.style)).toMatchObject({
      fontFamily: 'JetBrains Mono',
      fontSize: 16,
      fontWeight: '500'
    });
  });

  // Story 22.6 — the form frames set the card number's placeholder in Inter 17, and only the
  // value in the mono face.
  it('keeps an empty mono field’s placeholder in the body face', () => {
    render(
      <TextField
        label="Card number"
        value=""
        placeholder="Enter or scan card number"
        onChangeText={jest.fn()}
        mono
        testID="field"
      />
    );
    expect(flattenStyle(screen.getByTestId('field').props.style)).toMatchObject({
      fontFamily: 'Inter',
      fontSize: 17
    });
  });

  it('sets an ordinary field in Inter', () => {
    render(<TextField label="Name" value="" onChangeText={jest.fn()} testID="field" />);
    expect(flattenStyle(screen.getByTestId('field').props.style)).toMatchObject({
      fontFamily: 'Inter',
      fontSize: 17
    });
  });

  // AC10 / AC4b — the height IS the token, so 16.33's 44 → 48 reaches every input with no literal
  // here to hunt for (`tokens.generated.test.ts` pins the value itself).
  it('takes its minimum height from the touch-target token, at the 12pt control radius', () => {
    render(<TextField label="Name" value="" onChangeText={jest.fn()} testID="field" />);
    const { minHeight, borderRadius } = flattenStyle(screen.getByTestId('field').props.style);
    expect(TOUCH_TARGET.min).toBe(47);
    expect(minHeight).toBe(47);
    expect(borderRadius).toBe(12);
  });
});

/**
 * Story 22.6 — the trailing slot: a control OUTSIDE the box (the card number's scan button), 8pt to
 * its right and aligned with it. The label spans the whole row, and the message sits under the
 * input alone.
 */
describe('TextField trailing slot', () => {
  const renderWithTrailing = (error?: string) =>
    render(
      <TextField
        label="Card number"
        value=""
        onChangeText={jest.fn()}
        error={error}
        trailing={<Pressable testID="scan" />}
        testID="field"
      />
    );

  /** The nearest ancestor of `node` laid out as a row. */
  const rowOf = (testID: string) => {
    let node = screen.getByTestId(testID).parent;
    while (node && flattenStyle(node.props.style)?.flexDirection !== 'row') {
      node = node.parent;
    }
    return node;
  };

  it('sits beside the input, outside its box, 8pt to its right and top-aligned with it', () => {
    renderWithTrailing();

    const row = rowOf('scan');
    expect(row).toBeTruthy();
    expect(flattenStyle(row?.props.style)).toMatchObject({ gap: 8, alignItems: 'flex-start' });
    // The input is in the same row, in a column that takes the rest of the width.
    expect(rowOf('field')).toBe(row);
    let column = screen.getByTestId('field').parent;
    while (column && column.parent !== row) {
      column = column.parent;
    }
    expect(flattenStyle(column?.props.style).flex).toBe(1);
    // The control comes after the input, on its right.
    const tree = JSON.stringify(screen.toJSON());
    expect(tree.indexOf('"testID":"field"')).toBeGreaterThan(-1);
    expect(tree.indexOf('"testID":"field"')).toBeLessThan(tree.indexOf('"testID":"scan"'));
    // Outside the box: the input keeps its ordinary padding, with no room made inside it.
    expect(flattenStyle(screen.getByTestId('field').props.style).paddingRight).toBe(16);
  });

  it('lets the label span the whole row, above both', () => {
    renderWithTrailing();
    const row = rowOf('scan');
    let node = screen.getByText('Card number').parent;
    while (node) {
      expect(node).not.toBe(row);
      node = node.parent;
    }
  });

  it('sets the message under the input, not under the control', () => {
    renderWithTrailing('Card number is required');

    const row = rowOf('scan');
    const message = screen.getByTestId('field-error');
    // The message is inside the input's column, which is inside the row — not below the row.
    let column = screen.getByTestId('field').parent;
    while (column && column.parent !== row) {
      column = column.parent;
    }
    let node = message.parent;
    let underInput = false;
    while (node) {
      if (node === column) underInput = true;
      node = node.parent;
    }
    expect(underInput).toBe(true);
  });

  it('is absent unless given, leaving the field as it was', () => {
    render(<TextField label="Name" value="" onChangeText={jest.fn()} testID="field" />);
    expect(rowOf('field')).toBeFalsy();
  });
});

// The idiom on its own, for a field that is not a text input: the colour picker, a read-only value.
describe('FieldLabel', () => {
  it('is the same uppercase label-bold as a text field label', () => {
    render(<FieldLabel testID="label">Card color</FieldLabel>);
    expect(flattenStyle(screen.getByTestId('label').props.style)).toMatchObject({
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.26,
      textTransform: 'uppercase',
      color: LIGHT_THEME.textPrimary
    });
  });
});

describe('FieldError', () => {
  it('announces itself and uses the error colour, never a hardcoded red', () => {
    render(<FieldError testID="error">Card name is required</FieldError>);
    const error = screen.getByTestId('error');
    expect(error.props.accessibilityLiveRegion).toBe('polite');
    expect(flattenStyle(error.props.style).color).toBe(LIGHT_THEME.error);
  });

  it('sits 4pt below the input', () => {
    render(<FieldError testID="error">Card name is required</FieldError>);
    expect(flattenStyle(screen.getByTestId('error').props.style).marginTop).toBe(4);
  });

  /**
   * Story 22.6 — the live region is Android-only
   * (`ViewAccessibility.d.ts`: `accessibilityLiveRegion` is `@platform android`), so until then
   * VoiceOver never heard a field error appear. iOS now announces it as it appears and when it
   * changes, QUEUED: a plain announcement interrupts the one before, so when one Save raises two
   * errors VoiceOver would speak only the last. Android keeps the live region and is not told twice.
   */
  describe('the announcement', () => {
    const announce = AccessibilityInfo.announceForAccessibilityWithOptions as jest.Mock;
    const interrupting = AccessibilityInfo.announceForAccessibility as jest.Mock;

    it('announces a new error on iOS as it appears, and again when it changes, queued', () => {
      const platform = jest.replaceProperty(Platform, 'OS', 'ios');
      try {
        const view = render(<FieldError testID="error">Store name is required</FieldError>);
        expect(announce).toHaveBeenCalledTimes(1);
        expect(announce).toHaveBeenLastCalledWith('Store name is required', { queue: true });

        // A re-render with the same message is not a new error.
        view.rerender(<FieldError testID="error">Store name is required</FieldError>);
        expect(announce).toHaveBeenCalledTimes(1);

        view.rerender(
          <FieldError testID="error">Card name must be 50 characters or less</FieldError>
        );
        expect(announce).toHaveBeenCalledTimes(2);
        expect(announce).toHaveBeenLastCalledWith('Card name must be 50 characters or less', {
          queue: true
        });
        expect(interrupting).not.toHaveBeenCalled();
      } finally {
        platform.restore();
      }
    });

    // Edit's first Save raises both of its errors in one commit: each is queued, so both are heard.
    it('queues two errors that appear together, so neither cuts off the other', () => {
      const platform = jest.replaceProperty(Platform, 'OS', 'ios');
      try {
        render(
          <>
            <FieldError testID="name-error">Card name is required</FieldError>
            <FieldError testID="barcode-error">Barcode number is required</FieldError>
          </>
        );
        expect(announce.mock.calls).toEqual([
          ['Card name is required', { queue: true }],
          ['Barcode number is required', { queue: true }]
        ]);
        expect(interrupting).not.toHaveBeenCalled();
      } finally {
        platform.restore();
      }
    });

    it('leaves Android to its live region', () => {
      const platform = jest.replaceProperty(Platform, 'OS', 'android');
      try {
        render(<FieldError testID="error">Store name is required</FieldError>);
        expect(announce).not.toHaveBeenCalled();
        expect(interrupting).not.toHaveBeenCalled();
      } finally {
        platform.restore();
      }
    });

    it('is announced when a field’s error appears, on iOS', () => {
      const platform = jest.replaceProperty(Platform, 'OS', 'ios');
      try {
        const view = render(
          <TextField label="Store name" value="" onChangeText={jest.fn()} testID="field" />
        );
        expect(announce).not.toHaveBeenCalled();

        view.rerender(
          <TextField
            label="Store name"
            value=""
            onChangeText={jest.fn()}
            error="Store name is required"
            testID="field"
          />
        );
        expect(announce).toHaveBeenCalledWith('Store name is required', { queue: true });
      } finally {
        platform.restore();
      }
    });
  });
});
