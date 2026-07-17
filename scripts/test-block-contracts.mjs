import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const schemaRoot = path.join(root, 'schemas', 'blocks');
const schemas = new Map();
for (const file of [
  'shared.schema.json', 'block-base.schema.json', 'hero.schema.json', 'primary-cta.schema.json',
  'secondary-cta.schema.json', 'card-grid.schema.json', 'faq.schema.json', 'hub-spokes.schema.json',
  'breadcrumbs.schema.json', 'trust-bar.schema.json', 'how-it-works.schema.json',
  'service-area-map.schema.json', 'local-pro-tips.schema.json', 'gallery.schema.json',
  'testimonials.schema.json', 'contact.schema.json', 'form.schema.json', 'blog.schema.json',
]) {
  schemas.set(file, JSON.parse(await readFile(path.join(schemaRoot, file), 'utf8')));
}

const fixtures = JSON.parse(await readFile(
  path.join(root, 'apps', 'pumpkin-api.Tests', 'Fixtures', 'block-contracts.generated.json'),
  'utf8',
));
const errors = [];

for (const fixture of fixtures) {
  const match = [...schemas.entries()].find(([, schema]) => schema['x-pumpkin']?.type === fixture.type);
  if (!match) {
    errors.push(`${fixture.type}: no schema registered`);
    continue;
  }
  validate(fixture, schemas.get('block-base.schema.json'), 'block', match[1]);
  const contentSchema = match[1].$defs[match[1]['x-pumpkin'].contentType];
  validate(fixture.content, contentSchema, `${fixture.type}.content`, match[1]);
}

if (fixtures.length !== 16) errors.push(`expected 16 fixtures, found ${fixtures.length}`);
if (errors.length > 0) {
  console.error(`Block contract validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Validated ${fixtures.length} generated block fixtures against canonical schemas.`);
}

function validate(value, rawSchema, location, ownerSchema) {
  const schema = resolve(rawSchema, ownerSchema);
  if (schema.const !== undefined && value !== schema.const) errors.push(`${location}: expected constant ${schema.const}`);
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${location}: value is not in enum`);
  if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      errors.push(`${location}: expected object`);
      return;
    }
    for (const required of schema.required ?? []) {
      if (!Object.hasOwn(value, required)) errors.push(`${location}.${required}: required property is missing`);
    }
    for (const [name, propertySchema] of Object.entries(schema.properties ?? {})) {
      if (Object.hasOwn(value, name)) validate(value[name], propertySchema, `${location}.${name}`, ownerSchema);
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(value)) errors.push(`${location}: expected array`);
    else value.forEach((item, index) => validate(item, schema.items ?? {}, `${location}[${index}]`, ownerSchema));
  } else if (schema.type === 'string' && typeof value !== 'string') errors.push(`${location}: expected string`);
  else if (schema.type === 'boolean' && typeof value !== 'boolean') errors.push(`${location}: expected boolean`);
  else if (schema.type === 'integer' && !Number.isInteger(value)) errors.push(`${location}: expected integer`);
  else if (schema.type === 'number' && typeof value !== 'number') errors.push(`${location}: expected number`);
}

function resolve(schema, ownerSchema) {
  if (!schema?.$ref) return schema ?? {};
  const [file, pointer] = schema.$ref.split('#');
  const target = file ? schemas.get(file) : ownerSchema;
  return pointer
    ? pointer.split('/').filter(Boolean).reduce((value, key) => value[key], target)
    : target;
}
