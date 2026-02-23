/**
 * Example demonstrating pageSlug normalization and validation
 * 
 * This example shows how the PageJsonConverter ensures that pageSlug
 * values are always properly hyphenated (lowercase with hyphens).
 */

import { PageJsonConverter } from '../src/PageJsonConverter';

// Example 1: Normalize various slug formats
console.log('=== Slug Normalization Examples ===\n');

const testSlugs = [
  'My Page Title',
  'about/company/team',
  'home\\products\\services',
  'contact--us',
  '-leading-trailing-',
  'UPPERCASE',
  'Mixed Case Title',
  'already-valid-slug'
];

testSlugs.forEach(slug => {
  const normalized = PageJsonConverter.normalizeSlug(slug);
  const isValid = PageJsonConverter.isValidSlug(normalized);
  console.log(`Input:      "${slug}"`);
  console.log(`Normalized: "${normalized}"`);
  console.log(`Valid:      ${isValid}\n`);
});

// Example 2: Validate existing slugs
console.log('\n=== Slug Validation Examples ===\n');

const slugsToValidate = [
  'valid-slug',
  'Invalid Slug',
  'has--double-hyphens',
  '-starts-with-hyphen',
  'ends-with-hyphen-',
  'has/slash',
  'UpperCase',
  'proper-kebab-case'
];

slugsToValidate.forEach(slug => {
  const isValid = PageJsonConverter.isValidSlug(slug);
  console.log(`"${slug}" => ${isValid ? '✓ Valid' : '✗ Invalid'}`);
});

// Example 3: Automatic normalization when parsing JSON
console.log('\n=== JSON Parsing with Auto-Normalization ===\n');

const pageJson = `{
  "PageId": "test-123",
  "pageSlug": "My Page Title With Spaces",
  "tenantId": "tenant-1",
  "PageVersion": 1,
  "Layout": "standard",
  "MetaData": {
    "category": "test",
    "title": "Test Page"
  },
  "ContentData": {
    "ContentBlocks": []
  },
  "seo": {},
  "isPublished": false,
  "publishedAt": null,
  "includeInSitemap": true
}`;

const page = PageJsonConverter.fromJson(pageJson);
if (page) {
  console.log(`Original slug: "My Page Title With Spaces"`);
  console.log(`Auto-normalized to: "${page.pageSlug}"`);
  console.log(`Is valid: ${PageJsonConverter.isValidSlug(page.pageSlug)}`);
}
