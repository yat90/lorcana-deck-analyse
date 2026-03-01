import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    serviceWorker: {
      register: false
    },
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: true
    }),
    paths: {
      // SvelteKit: base must be '' or start with / and must NOT end with /
      base: (process.env.BASE_PATH ?? '').replace(/\/$/, '')
    },
    prerender: {
      entries: ['*']
    }
  }
};

export default config;
