import type { Config } from 'tailwindcss';

import baseConfig from '@cs/ui/tailwind.config';

const { fontFamily } = require('tailwindcss/defaultTheme');

export default {
  content: [...baseConfig.content, 'src/**/*.{ts,tsx}'],
  presets: [baseConfig],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-rubik)', ...fontFamily.sans],
      },
    },
  },
} satisfies Config;
