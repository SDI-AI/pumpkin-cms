import type { Theme } from 'pumpkin-ts-models';

/**
 * Fallback theme used when the API doesn't return an active theme.
 * Mirrors the pumpkin-theme.json sample data.
 */
export const fallbackTheme: Theme = require('./pumpkin-theme.json') as Theme;
