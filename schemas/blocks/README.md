# Pumpkin block contracts

The JSON Schemas in this directory are the canonical contracts for Pumpkin page blocks. Generated TypeScript and C# model files must not be edited by hand.

## Workflow

From `packages/pumpkin-ts-models`:

```powershell
npm run blocks:generate
npm run blocks:check
npm run blocks:test
```

`blocks:generate` deterministically updates:

- TypeScript block interfaces and the discriminated union
- the .NET block/content classes and discriminator registry
- Starter App block defaults
- cross-language contract fixtures

`blocks:check` exits unsuccessfully when committed generated output differs from the schemas. `blocks:test` validates every generated fixture against its canonical schema. The .NET contract runner additionally verifies that all known and unknown blocks survive JSON round trips without field loss.

## Adding a block type

1. Add a Draft 2020-12 schema with `x-pumpkin` metadata.
2. Reference it from `html-block.schema.json`.
3. Generate the contracts.
4. Implement and register the handwritten React view and editor.
5. Add theme style slots and CSS.
6. Run the schema, .NET, package, and Starter App verification commands.

`schemaVersion` is optional for existing stored blocks and defaults to `1` for newly created blocks. Additive optional properties are backward compatible. Renames, removals, or structural changes require an explicit migration and a schema-version increment.

`id` is the stable machine identity for a block. Editors generate UUIDs for new blocks, while legacy non-empty identifiers remain valid for backward compatibility. `styleKey` is an optional, human-readable CSS hook using lowercase kebab case; renderers expose it as `data-style-key`.
