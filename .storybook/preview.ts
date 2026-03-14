import type { Preview } from '@storybook/react';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'deep-space',
      values: [
        { name: 'deep-space', value: '#020509' },
        { name: 'neutral', value: '#111827' },
      ],
    },
  },
};

export default preview;
