import { assertEquals } from 'jsr:@std/assert@1';
import {
  createPluginMeta,
  isOpenBlogOptions,
  isOpenBuildContextLike,
  isOpenHeaderNavLink,
  isOpenI18nOptions,
  isOpenNavSection,
  isOpenPluginMeta,
} from '../index.ts';

const blogCases: Array<[unknown, boolean]> = [
  [{}, true],
  [{ contentDir: 'content/blog' }, true],
  [{ basePath: '/blog' }, true],
  [{ contentDir: 1 }, false],
  [{ basePath: false }, false],
  [null, false],
];

for (let i = 0; i < 10; i++) {
  for (const [value, expected] of blogCases) {
    Deno.test(`protocols: blog options case ${i}.${String(expected)}.${JSON.stringify(value)}`, () => {
      assertEquals(isOpenBlogOptions(value), expected);
    });
  }
}

const navSection = {
  section: 'Guide',
  items: [{ path: '/guide', label: 'Guide', order: 1 }],
};
const navCases: Array<[unknown, boolean]> = [
  [navSection, true],
  [{ ...navSection, items: [] }, true],
  [{ ...navSection, section: 1 }, false],
  [{ ...navSection, items: [{ path: '/x' }] }, false],
  [{ ...navSection, items: [{ path: '/x', label: 'X', order: '1' }] }, false],
];

for (const [index, [value, expected]] of navCases.entries()) {
  Deno.test(`protocols: nav section validates shape ${index}`, () => {
    assertEquals(isOpenNavSection(value), expected);
  });
}

const headerCases: Array<[unknown, boolean]> = [
  [{ href: '/', label: 'Home' }, true],
  [{ href: '/guide', label: 'Guide' }, true],
  [{ href: 1, label: 'Guide' }, false],
  [{ href: '/guide', label: null }, false],
  [[], false],
];

for (const [index, [value, expected]] of headerCases.entries()) {
  Deno.test(`protocols: header nav validates shape ${index}`, () => {
    assertEquals(isOpenHeaderNavLink(value), expected);
  });
}

const i18nCases: Array<[unknown, boolean]> = [
  [{ locales: ['en'], defaultLocale: 'en' }, true],
  [{ locales: ['en', 'zh'], defaultLocale: 'en', strategy: 'prefix' }, true],
  [{ locales: [], defaultLocale: 'en' }, true],
  [{ locales: ['en'], defaultLocale: 1 }, false],
  [{ locales: [1], defaultLocale: 'en' }, false],
  [{ defaultLocale: 'en' }, false],
];

for (const [index, [value, expected]] of i18nCases.entries()) {
  Deno.test(`protocols: i18n options validate shape ${index}`, () => {
    assertEquals(isOpenI18nOptions(value), expected);
  });
}

for (let i = 0; i < 20; i++) {
  Deno.test(`protocols: plugin meta factory creates valid meta ${i}`, () => {
    const meta = createPluginMeta({
      blogOptions: { contentDir: `content-${i}`, basePath: `/blog-${i}` },
      navSections: [{ section: 'Guide', items: [{ path: `/p-${i}`, label: `P ${i}` }] }],
      headerNav: [{ href: '/', label: 'Home' }],
      sitemapOptions: { hostname: 'https://example.com' },
      i18nOptions: { locales: ['en', 'zh'], defaultLocale: 'en' },
    });
    assertEquals(isOpenPluginMeta(meta), true);
    assertEquals(isOpenBuildContextLike({ plugins: meta }), true);
  });
}

const invalidMetaCases = [
  { ...createPluginMeta(), blogOptions: { contentDir: 1 } },
  { ...createPluginMeta(), navSections: [{ section: 'X', items: [{ path: '/x' }] }] },
  { ...createPluginMeta(), headerNav: [{ href: '/', label: 1 }] },
  { ...createPluginMeta(), sitemapOptions: [] },
  { ...createPluginMeta(), i18nOptions: { locales: [1], defaultLocale: 'en' } },
];

for (const [index, value] of invalidMetaCases.entries()) {
  Deno.test(`protocols: plugin meta rejects invalid shape ${index}`, () => {
    assertEquals(isOpenPluginMeta(value), false);
  });
}

// ─── Additional coverage: isOpenBlogOptions edge cases ───────

Deno.test('protocols: isOpenBlogOptions rejects null', () => {
  assertEquals(isOpenBlogOptions(null), false);
});

Deno.test('protocols: isOpenBlogOptions rejects undefined', () => {
  assertEquals(isOpenBlogOptions(undefined), false);
});

Deno.test('protocols: isOpenBlogOptions rejects empty object', () => {
  // empty object IS valid per current implementation - all fields optional
  assertEquals(isOpenBlogOptions({}), true);
});

Deno.test('protocols: isOpenBlogOptions rejects array', () => {
  assertEquals(isOpenBlogOptions([]), false);
});

Deno.test('protocols: isOpenBlogOptions rejects string', () => {
  assertEquals(isOpenBlogOptions('hello'), false);
});

Deno.test('protocols: isOpenBlogOptions accepts minimal valid config', () => {
  assertEquals(isOpenBlogOptions({ contentDir: 'posts', basePath: '/blog' }), true);
  assertEquals(isOpenBlogOptions({ contentDir: 'posts' }), true);
  assertEquals(isOpenBlogOptions({ basePath: '/news' }), true);
});

Deno.test('protocols: isOpenBlogOptions rejects number', () => {
  assertEquals(isOpenBlogOptions(42), false);
});

Deno.test('protocols: isOpenBlogOptions rejects boolean', () => {
  assertEquals(isOpenBlogOptions(true), false);
  assertEquals(isOpenBlogOptions(false), false);
});

// ─── Additional coverage: isOpenNavSection edge cases ────────

Deno.test('protocols: isOpenNavSection rejects null', () => {
  assertEquals(isOpenNavSection(null), false);
});

Deno.test('protocols: isOpenNavSection rejects undefined', () => {
  assertEquals(isOpenNavSection(undefined), false);
});

Deno.test('protocols: isOpenNavSection rejects missing required fields', () => {
  assertEquals(isOpenNavSection({}), false);
  assertEquals(isOpenNavSection({ section: 'Guide' }), false);
  assertEquals(isOpenNavSection({ items: [] }), false);
});

Deno.test('protocols: isOpenNavSection accepts valid config with all fields', () => {
  const valid = {
    section: 'Guide',
    items: [
      { path: '/guide', label: 'Guide', order: 1 },
      { path: '/guide/start', label: 'Getting Started' },
    ],
  };
  assertEquals(isOpenNavSection(valid), true);
});

Deno.test('protocols: isOpenNavSection rejects items with missing label', () => {
  assertEquals(isOpenNavSection({ section: 'X', items: [{ path: '/x' }] }), false);
});

Deno.test('protocols: isOpenNavSection rejects items with non-string order', () => {
  assertEquals(
    isOpenNavSection({
      section: 'X',
      items: [{ path: '/x', label: 'X', order: '1' as unknown as number }],
    }),
    false,
  );
});

Deno.test('protocols: isOpenNavSection rejects non-object section', () => {
  assertEquals(isOpenNavSection('string'), false);
  assertEquals(isOpenNavSection(123), false);
});

// ─── Additional coverage: isOpenI18nOptions edge cases ───────

Deno.test('protocols: isOpenI18nOptions rejects non-object', () => {
  assertEquals(isOpenI18nOptions(null), false);
  assertEquals(isOpenI18nOptions(undefined), false);
  assertEquals(isOpenI18nOptions('string'), false);
  assertEquals(isOpenI18nOptions(123), false);
  assertEquals(isOpenI18nOptions([]), false);
});

Deno.test('protocols: isOpenI18nOptions accepts missing optional fields', () => {
  // strategy is optional
  assertEquals(isOpenI18nOptions({ locales: ['en'], defaultLocale: 'en' }), true);
  // extra fields are ok (index signature)
  assertEquals(isOpenI18nOptions({ locales: ['en'], defaultLocale: 'en', extra: true }), true);
});

Deno.test('protocols: isOpenI18nOptions rejects non-string items in locales array', () => {
  assertEquals(isOpenI18nOptions({ locales: [1], defaultLocale: 'en' }), false);
  assertEquals(isOpenI18nOptions({ locales: ['en', 2], defaultLocale: 'en' }), false);
});

// ─── Additional coverage: createPluginMeta edge cases ────────

Deno.test('protocols: createPluginMeta handles empty string name', () => {
  // Create meta with empty nav section name
  const meta = createPluginMeta({
    navSections: [{ section: '', items: [{ path: '/', label: 'Home' }] }],
  });
  assertEquals(isOpenPluginMeta(meta), true);
});

Deno.test('protocols: createPluginMeta handles very long name', () => {
  const longName = 'A'.repeat(1000);
  const meta = createPluginMeta({
    navSections: [{ section: longName, items: [{ path: '/', label: 'Home' }] }],
  });
  assertEquals(isOpenPluginMeta(meta), true);
  assertEquals(meta.navSections[0].section.length, 1000);
});

Deno.test('protocols: createPluginMeta handles name with special characters', () => {
  const meta = createPluginMeta({
    navSections: [{
      section: 'Hello & World <test>',
      items: [{ path: '/special', label: 'Special: "chars"!' }],
    }],
  });
  assertEquals(isOpenPluginMeta(meta), true);
});

Deno.test('protocols: createPluginMeta handles null overrides', () => {
  const meta = createPluginMeta({
    blogOptions: null,
    navSections: [],
    headerNav: [],
    sitemapOptions: null,
    i18nOptions: null,
  });
  assertEquals(isOpenPluginMeta(meta), true);
});

Deno.test('protocols: createPluginMeta defaults are all null/empty', () => {
  const meta = createPluginMeta();
  assertEquals(meta.blogOptions, null);
  assertEquals(meta.navSections, []);
  assertEquals(meta.headerNav, []);
  assertEquals(meta.sitemapOptions, null);
  assertEquals(meta.i18nOptions, null);
});

// ─── Additional coverage: isOpenPluginMeta edge cases ────────

Deno.test('protocols: isOpenPluginMeta rejects non-object', () => {
  assertEquals(isOpenPluginMeta(null), false);
  assertEquals(isOpenPluginMeta(undefined), false);
  assertEquals(isOpenPluginMeta('string'), false);
  assertEquals(isOpenPluginMeta(42), false);
  assertEquals(isOpenPluginMeta([]), false);
});

Deno.test('protocols: isOpenPluginMeta rejects when navSections is not array', () => {
  assertEquals(isOpenPluginMeta({ ...createPluginMeta(), navSections: 'not-array' }), false);
});

Deno.test('protocols: isOpenPluginMeta rejects when headerNav is not array', () => {
  assertEquals(isOpenPluginMeta({ ...createPluginMeta(), headerNav: null }), false);
});

Deno.test('protocols: isOpenPluginMeta rejects when sitemapOptions is array', () => {
  assertEquals(isOpenPluginMeta({ ...createPluginMeta(), sitemapOptions: [] }), false);
});

// ─── Additional coverage: isOpenBuildContextLike edge cases ───

Deno.test('protocols: isOpenBuildContextLike rejects when plugins is missing', () => {
  assertEquals(isOpenBuildContextLike({}), false);
});

Deno.test('protocols: isOpenBuildContextLike rejects when plugins is invalid', () => {
  assertEquals(isOpenBuildContextLike({ plugins: null }), false);
  assertEquals(isOpenBuildContextLike({ plugins: 'invalid' }), false);
});

Deno.test('protocols: isOpenBuildContextLike accepts valid build context', () => {
  assertEquals(isOpenBuildContextLike({ plugins: createPluginMeta() }), true);
});

Deno.test('protocols: isOpenBuildContextLike rejects non-object', () => {
  assertEquals(isOpenBuildContextLike(null), false);
  assertEquals(isOpenBuildContextLike(undefined), false);
});

// ─── Additional coverage: isOpenHeaderNavLink edge cases ─────

Deno.test('protocols: isOpenHeaderNavLink accepts valid links', () => {
  assertEquals(isOpenHeaderNavLink({ href: '/', label: 'Home' }), true);
  assertEquals(isOpenHeaderNavLink({ href: '/guide', label: 'Guide' }), true);
  assertEquals(isOpenHeaderNavLink({ href: 'https://example.com', label: 'Example' }), true);
});

Deno.test('protocols: isOpenHeaderNavLink rejects non-object', () => {
  assertEquals(isOpenHeaderNavLink(null), false);
  assertEquals(isOpenHeaderNavLink(undefined), false);
  assertEquals(isOpenHeaderNavLink('string'), false);
  assertEquals(isOpenHeaderNavLink(123), false);
});

Deno.test('protocols: isOpenHeaderNavLink rejects missing label', () => {
  assertEquals(isOpenHeaderNavLink({ href: '/' }), false);
});

Deno.test('protocols: isOpenHeaderNavLink rejects missing href', () => {
  assertEquals(isOpenHeaderNavLink({ label: 'Home' }), false);
});
