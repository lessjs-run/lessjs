import { assertEquals } from 'jsr:@std/assert@1';
import {
  createPluginMeta,
  isLessBlogOptions,
  isLessBuildContextLike,
  isLessHeaderNavLink,
  isLessI18nOptions,
  isLessNavSection,
  isLessPluginMeta,
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
      assertEquals(isLessBlogOptions(value), expected);
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
    assertEquals(isLessNavSection(value), expected);
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
    assertEquals(isLessHeaderNavLink(value), expected);
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
    assertEquals(isLessI18nOptions(value), expected);
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
    assertEquals(isLessPluginMeta(meta), true);
    assertEquals(isLessBuildContextLike({ plugins: meta }), true);
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
    assertEquals(isLessPluginMeta(value), false);
  });
}
