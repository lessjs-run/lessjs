/**
 * @lessjs/i18n - i18n data loader
 *
 * Pure function for loading i18n configuration.
 * Zero module-level state.
 *
 * ADR 0018: Replaces the old stateful initI18nData() + getI18nOptions() pattern.
 * Route components import data from virtual:less-i18n-data instead.
 * This module is only called by the virtual module plugin's load() hook.
 */

import type { LessI18nOptions } from './types.ts';

/**
 * Pure function: load i18n configuration.
 * No module-level state. No side effects.
 *
 * This replaces the stateful initI18nData() + getI18nOptions() pattern.
 * For virtual module consumers, use virtual:less-i18n-data instead.
 */
export function loadI18nData(options: LessI18nOptions): LessI18nOptions {
  return {
    ...options,
    locales: [...options.locales],
  };
}
