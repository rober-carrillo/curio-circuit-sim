import { join } from 'path';

/**
 * @type {import('vite').UserConfig}
 */
const config = {
  base: '',
  resolve: {
    alias: { avr8js: join(__dirname, '../src') },
  },
  server: {
    port: 3000,
    open: '/generic.html', // Open generic.html by default
    strictPort: false,
  },
};

export default config;
