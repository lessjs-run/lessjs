import { assertEquals, assertRejects } from 'jsr:@std/assert@1';
import { extractHubClientOnlyTags, loadHubClientOnlyTags } from '../src/hub-client-only-tags.ts';
import { LessError } from '@lessjs/core/errors';

Deno.test('extractHubClientOnlyTags returns unique client-only tag names', () => {
  const tags = extractHubClientOnlyTags({
    alpha: {
      tags: [
        { tagName: 'sl-button', compatibility: 'client-only' },
        { tagName: 'sl-button', compatibility: 'client-only' },
        { tagName: 'less-card', compatibility: 'ssr' },
      ],
    },
    beta: {
      tags: [
        { tagName: 'media-player', compatibility: 'client-only' },
        { compatibility: 'client-only' },
      ],
    },
  });

  assertEquals(tags.sort(), ['media-player', 'sl-button']);
});

Deno.test('loadHubClientOnlyTags treats missing generated hub data as optional', async () => {
  const root = await Deno.makeTempDir();
  try {
    const result = await loadHubClientOnlyTags(root);
    assertEquals(result.status, 'missing');
    assertEquals(result.tags, []);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('loadHubClientOnlyTags imports generated hub data through module boundary', async () => {
  const root = await Deno.makeTempDir();
  try {
    const dataDir = `${root}/app/data/registry`;
    await Deno.mkdir(dataDir, { recursive: true });
    await Deno.writeTextFile(
      `${dataDir}/hub-data.ts`,
      [
        'export default {',
        '  shoelace: { tags: [{ tagName: "sl-button", compatibility: "client-only" }] },',
        '  native: { tags: [{ tagName: "less-card", compatibility: "ssr" }] },',
        '};',
      ].join('\n'),
    );

    const result = await loadHubClientOnlyTags(root);
    assertEquals(result.status, 'loaded');
    assertEquals(result.tags, ['sl-button']);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('loadHubClientOnlyTags throws when present generated hub data is broken', async () => {
  const root = await Deno.makeTempDir();
  try {
    const dataDir = `${root}/app/data/registry`;
    await Deno.mkdir(dataDir, { recursive: true });
    await Deno.writeTextFile(`${dataDir}/hub-data.ts`, 'export default {');

    const err = await assertRejects(
      () => loadHubClientOnlyTags(root, { onError: 'throw' }),
      LessError,
      'Generated Hub data exists but failed to import',
    );
    assertEquals(err.code, 'HUB_DATA_IMPORT_ERROR');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
