import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Text } from 'react-native';

import { useTheme } from '@/shared/theme';
import { TYPOGRAPHY } from '@/shared/theme/typography';

import { BulletList } from './BulletList';
import { DocumentScreen } from './DocumentScreen';

/*
 * The policy's blocks, for the story only: the real ones are `PrivacyPolicyScreen`'s, which lives in
 * `features/privacy` and is out of this directory's reach. Their measures are frame A's.
 */

/** A paragraph as frame A sets it: `body-md` in `textPrimary`, 8 below. */
const Paragraph = ({ children }: { children: string }) => {
  const { theme } = useTheme();
  return (
    <Text style={{ ...TYPOGRAPHY.bodyMd, color: theme.textPrimary, marginBottom: 8 }}>
      {children}
    </Text>
  );
};

/** A section head as frame A sets it: `body-lg` semibold, announced as a heading. */
const SectionHead = ({ children }: { children: string }) => {
  const { theme } = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{
        ...TYPOGRAPHY.bodyLgStrong,
        color: theme.textPrimary,
        marginTop: 24,
        marginBottom: 8
      }}
    >
      {children}
    </Text>
  );
};

/** The meta line: document metadata, the chrome tier. */
const MetaLine = ({ children }: { children: string }) => {
  const { theme } = useTheme();
  return (
    <Text style={{ ...TYPOGRAPHY.captionSm, color: theme.textSecondary, marginBottom: 8 }}>
      {children}
    </Text>
  );
};

const meta = {
  title: 'UI/DocumentScreen',
  component: DocumentScreen,
  args: {
    title: 'Privacy Policy',
    onBack: () => {},
    children: [
      <MetaLine key="meta">Version 1.0.0 · Last updated: 2026-03-06</MetaLine>,
      <SectionHead key="head">2. Data We Collect</SectionHead>,
      <Paragraph key="paragraph">When you create an account, we collect:</Paragraph>,
      <BulletList
        key="bullets"
        tone="default"
        items={[
          'Email address — used for authentication and account recovery.',
          'Consent records — whether and when you accepted this Privacy Policy.'
        ]}
      />
    ]
  }
} satisfies Meta<typeof DocumentScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Frame A's ground: the header carries the title, and the body opens with the meta line. */
export const Prose: Story = {};

/** A title too long for one line wraps, and the header grows rather than clipping it. */
export const LongTitle: Story = {
  args: { title: 'Informativa sulla privacy e dati raccolti' }
};
