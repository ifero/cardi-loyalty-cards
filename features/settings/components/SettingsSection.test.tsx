/**
 * SettingsSection — one settings group, frame A (Story 22.7): its head over a divided surface.
 *
 * Rendered through the real `StoryDecorator`, because the head and the hairlines are theme roles.
 */
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { SectionHeader } from '@/shared/components/ui/SectionHeader';
import { Surface } from '@/shared/components/ui/Surface';
import { DARK_THEME, LIGHT_THEME } from '@/shared/theme/colors';

import { StoryDecorator } from '@/.storybook/StoryDecorator';

import { SettingsSection } from './SettingsSection';

type Scheme = 'light' | 'dark';

type Node = { type: unknown; props: { style?: unknown }; children: (Node | string)[] };

/** The style of the view a component renders first. */
const firstChildStyle = (instance: { children: unknown[] }) => {
  const child = instance.children[0] as Node | string | undefined;
  return typeof child === 'object' ? StyleSheet.flatten(child.props.style as never) : undefined;
};

const renderSection = (scheme: Scheme = 'light', showLast = true) =>
  render(
    <StoryDecorator theme={scheme}>
      <SettingsSection title="Data">
        <Text>Export Data</Text>
        <Text>Import Data</Text>
        {showLast ? <Text>Sync</Text> : null}
      </SettingsSection>
    </StoryDecorator>
  );

describe('SettingsSection (frame A)', () => {
  it('heads the group with the shared section header, a heading uppercase by style', () => {
    renderSection();
    expect(screen.UNSAFE_getByType(SectionHeader).props.title).toBe('Data');
    const head = screen.getByRole('header', { name: 'Data' });
    expect(StyleSheet.flatten(head.props.style).textTransform).toBe('uppercase');
  });

  // The 8 is the group's gap, so the head sits 8 above its surface.
  it('sets the head 8 above its surface, the surface divided by full-width rules', () => {
    renderSection();
    expect(firstChildStyle(screen.UNSAFE_getByType(SettingsSection))).toMatchObject({ gap: 8 });
    expect(screen.UNSAFE_getByType(Surface).props.divided).toBe(true);
    const tree = JSON.stringify(screen.toJSON());
    expect(tree.indexOf('"Data"')).toBeLessThan(tree.indexOf('"Export Data"'));
  });

  it.each<[Scheme, typeof LIGHT_THEME | typeof DARK_THEME]>([
    ['light', LIGHT_THEME],
    ['dark', DARK_THEME]
  ])('draws a %s hairline-outlined surface', (scheme, roles) => {
    renderSection(scheme);
    expect(firstChildStyle(screen.UNSAFE_getByType(Surface))).toMatchObject({
      backgroundColor: roles.surface,
      borderColor: roles.border,
      borderWidth: 1,
      borderRadius: 16
    });
  });

  // A row the screen leaves out — Sync, for a guest — leaves no rule behind.
  it('rules only between the rows it holds', () => {
    const rules = () =>
      screen
        .UNSAFE_getByType(Surface)
        .findAll(
          (node: Node) =>
            typeof node.type === 'string' &&
            (StyleSheet.flatten(node.props.style as never) as { height?: number } | undefined)
              ?.height === 1
        );
    renderSection('light', true);
    expect(rules()).toHaveLength(2);
    screen.unmount();

    renderSection('light', false);
    expect(rules()).toHaveLength(1);
  });
});
