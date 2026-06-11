import { createOpenElementNitroHandler } from '../packages/adapter-vite/src/nitro-mount.ts';

const preset = Deno.args[0];

if (preset !== 'node' && preset !== 'workers') {
  console.error('Usage: deno run tools/nitro-proof.ts <node|workers>');
  Deno.exit(2);
}

const mount = createOpenElementNitroHandler({
  baseUrl: preset === 'workers' ? 'https://worker.example' : 'http://localhost',
  env: { OPEN_ELEMENT_PRESET: preset },
  platform: { preset },
  handler: (request, context) => {
    const url = new URL(request.url);
    return Response.json({
      ok: true,
      preset,
      path: url.pathname,
      envPreset: context?.env?.OPEN_ELEMENT_PRESET,
      platformPreset: (context?.platform as { preset?: string } | undefined)?.preset,
    });
  },
});

const response = await mount({
  method: 'GET',
  path: '/__openelement_nitro_proof',
});
const payload = await response.response.json() as {
  ok?: boolean;
  preset?: string;
  path?: string;
  envPreset?: string;
  platformPreset?: string;
};

if (
  response.status !== 200 ||
  payload.ok !== true ||
  payload.preset !== preset ||
  payload.path !== '/__openelement_nitro_proof' ||
  payload.envPreset !== preset ||
  payload.platformPreset !== preset
) {
  console.error(JSON.stringify({ preset, status: response.status, payload }, null, 2));
  Deno.exit(1);
}

console.log(`nitro proof ${preset}: openElement handler bridge passed`);
