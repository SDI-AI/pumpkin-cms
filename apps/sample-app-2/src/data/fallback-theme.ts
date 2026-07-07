import type { Theme } from 'pumpkin-ts-models';

/**
 * The active site theme, loaded from a static JSON file at build time.
 *
 * Configure which file to use via the PUMPKIN_THEME_FILE environment variable
 * (defaults to "pumpkin-theme.json"). The file must live in src/data/ so that
 * Tailwind's content scanner can pick up every class string at build time —
 * the tailwind.config.js already includes './src/data/*.json'.
 *
 * Workflow:
 *   1. Edit theme in the admin UI
 *   2. Click "Export JSON" to download {themeId}-theme.json
 *   3. Drop the file into apps/sample-app/src/data/
 *   4. Set PUMPKIN_THEME_FILE={themeId}-theme.json in .env
 *   5. Rebuild — Tailwind scans the new file, no purged classes
 */
const themeFile = process.env.PUMPKIN_THEME_FILE || 'pumpkin-theme.json';

// eslint-disable-next-line @typescript-eslint/no-require-imports
export const siteTheme: Theme = require(`./${themeFile}`) as Theme;

/** @deprecated Use siteTheme instead. Kept for backwards compatibility. */
export const fallbackTheme = siteTheme;
