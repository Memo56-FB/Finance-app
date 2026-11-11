import { PreferencesProvider } from '../lib/i18n/client'
import { en } from '../lib/i18n'
import { defaults } from '../lib/i18n/preferences'
import type { Preview } from "@storybook/nextjs";
import '../app/globals.css';

const preview: Preview = {
  decorators: [(Story) => <PreferencesProvider preferences={defaults} messages={en}><Story /></PreferencesProvider>],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },

  tags: ["autodocs", "autodocs"]
};

export default preview;
