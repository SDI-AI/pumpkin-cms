# Theme ISR Requirements

Phase 1 keeps the API/model contract ready for the sample app. The sample app should apply themes through CSS custom properties while still allowing statically generated pages to revalidate safely.

## Active Theme Fetch

- Use `GET /api/themes/{tenantId}` as the public active-theme contract.
- The response must include `id`, `label`, `updatedAt`, `version`, `preview`, and `cssVariables`.
- In the sample app, fetch the active theme with a bounded ISR window and stable cache tag:

```ts
await fetch(`${apiBaseUrl}/api/themes/${tenantId}`, {
  next: {
    revalidate: 60,
    tags: [`tenant:${tenantId}:theme`],
  },
});
```

## Applying The Theme

- Render the active theme CSS variables into the server-rendered document shell before page content paints.
- Use `data-theme={theme.id}` on `<html>` or the app root.
- Tailwind tokens should read from variables such as `--background`, `--foreground`, `--primary`, `--accent`, `--border`, and matching component tokens.
- Client-side theme switching can update the same variables immediately, then persist the selected theme after activation.

## Revalidation

- Theme activation must invalidate `tenant:{tenantId}:theme`.
- If page rendering embeds theme variables directly into HTML, also invalidate tenant page tags such as `tenant:{tenantId}:pages`.
- Until a webhook or server action exists, keep the ISR revalidate window short enough that theme changes settle quickly without making every page dynamic.

## Later Sample App Requirements

- Central TypeScript theme collection with id, name, label, description, preview palette, and full CSS variable set.
- Starter themes: Light, Dark, Ocean, Forest, Minimal, Corporate, Vibrant, and one additional editorial or warm theme.
- Theme provider that supports persisted selection through localStorage and, when authenticated, the API/database.
- Gallery/browser UI with live preview cards, search, filters, and one-click activation.
- Custom user themes saved per user or tenant using the Phase 1 `Theme` model.
