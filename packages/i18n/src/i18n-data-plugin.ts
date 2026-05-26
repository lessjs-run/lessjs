/**
 * @lessjs/i18n - i18n Data Virtual Module Plugin
 *
 * Creates the virtual:less-i18n-data Vite virtual module that provides
 * locale configuration data to route components during SSR.
 *
 * Lives in @lessjs/i18n (not adapter-vite) because it depends on
 * @lessjs/i18n's loadI18nData() - avoids circular dependency between
 * adapter-vite <-> i18n.
 */

import type { Plugin } from 'vite';
import type { LessBuildContextLike } from '@lessjs/protocols/build-types';
import { RESOLVED_I18N_DATA_ID, VIRTUAL_I18N_DATA_ID } from '@lessjs/protocols/virtual-ids';

export function createI18nDataPlugin(ctx: LessBuildContextLike): Plugin {
  return {
    name: 'less:i18n-data',
    enforce: 'pre',

    resolveId(id) {
      if (id === VIRTUAL_I18N_DATA_ID) return RESOLVED_I18N_DATA_ID;
    },

    load(id) {
      if (id !== RESOLVED_I18N_DATA_ID) return;

      const i18nOpts = ctx.plugins.i18nOptions;
      if (!i18nOpts) {
        return [
          'export const locales = [];',
          'export function getDefaultLocale() { return "en"; }',
          'export function getI18nOptions() { return null; }',
        ].join('\n');
      }

      return [
        `const _options = ${JSON.stringify(i18nOpts)};`,
        'export const locales = _options.locales;',
        'export function getDefaultLocale() { return _options.defaultLocale || "en"; }',
        'export function getI18nOptions() { return _options; }',
      ].join('\n');
    },
  };
}
