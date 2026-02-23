/**
 * Merges default class name strings with optional overrides.
 * Uses full-replace strategy: if an override is provided for a key,
 * it completely replaces the default (no appending / merging).
 *
 * This keeps the package framework-agnostic — Tailwind, Bootstrap,
 * vanilla CSS, or CSS Modules all work the same way.
 */
export function mergeClasses<T extends Record<string, string>>(
  defaults: T,
  overrides?: Partial<T>
): T {
  if (!overrides) return defaults;
  const merged = { ...defaults };
  for (const key in overrides) {
    if (overrides[key] !== undefined) {
      (merged as Record<string, string>)[key] = overrides[key] as string;
    }
  }
  return merged;
}
