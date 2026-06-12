const preset = process.env.OPEN_ELEMENT_NITRO_PRESET || 'node';
const outputDir = preset === 'cloudflare_module' ? '.output-workers' : '.output-node';

export default defineNitroConfig({
  serverDir: 'server',
  preset,
  routeRules: {
    '/isr': {
      cache: {
        maxAge: 60,
        swr: true,
      },
    },
  },
  output: {
    dir: outputDir,
  },
  compatibilityDate: '2026-06-12',
});
