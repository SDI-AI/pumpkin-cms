const GOOGLE_ANALYTICS_ID_PATTERN = /^G-[A-Z0-9]+$/i;

export function getGoogleAnalyticsMeasurementId(): string | null {
  const value = (
    process.env.PUMPKIN_GOOGLE_ANALYTICS_ID ||
    process.env.NEXT_PUBLIC_PUMPKIN_GOOGLE_ANALYTICS_ID ||
    ''
  ).trim();

  if (!value) return null;

  if (!GOOGLE_ANALYTICS_ID_PATTERN.test(value)) {
    console.warn('[Analytics] Ignoring invalid Google Analytics measurement ID.');
    return null;
  }

  return value.toUpperCase();
}
