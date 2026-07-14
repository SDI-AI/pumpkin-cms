'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface StructuredDataModalProps {
  initialValue: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  title: string;
}

interface SchemaTemplate {
  label: string;
  type: string;
  value: Record<string, unknown>;
}

const schemaTemplates: SchemaTemplate[] = [
  {
    label: 'Article',
    type: 'Article',
    value: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: '',
      description: '',
      image: '',
      author: { '@type': 'Person', name: '' },
      datePublished: '',
      dateModified: '',
    },
  },
  {
    label: 'Local Business',
    type: 'LocalBusiness',
    value: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: '',
      description: '',
      url: '',
      telephone: '',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '',
        addressLocality: '',
        addressRegion: '',
        postalCode: '',
        addressCountry: 'US',
      },
    },
  },
  {
    label: 'FAQ Page',
    type: 'FAQPage',
    value: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: '',
          acceptedAnswer: { '@type': 'Answer', text: '' },
        },
      ],
    },
  },
  {
    label: 'Web Page',
    type: 'WebPage',
    value: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: '',
      description: '',
      url: '',
    },
  },
  {
    label: 'Product',
    type: 'Product',
    value: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: '',
      image: '',
      description: '',
      brand: { '@type': 'Brand', name: '' },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: '',
        availability: 'https://schema.org/InStock',
      },
    },
  },
  {
    label: 'Service',
    type: 'Service',
    value: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: '',
      provider: { '@type': 'Organization', name: '' },
      areaServed: { '@type': 'Place', name: '' },
    },
  },
];

export function StructuredDataModal({
  initialValue,
  isOpen,
  onClose,
  onSave,
  title,
}: StructuredDataModalProps) {
  if (!isOpen) return null;

  return (
    <StructuredDataModalContent
      initialValue={initialValue}
      onClose={onClose}
      onSave={onSave}
      title={title}
    />
  );
}

function StructuredDataModalContent({
  initialValue,
  onClose,
  onSave,
  title,
}: Omit<StructuredDataModalProps, 'isOpen'>) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');

  const applyTemplate = (template: SchemaTemplate) => {
    setValue(JSON.stringify(template.value, null, 2));
    setError('');
  };

  const save = () => {
    try {
      if (value.trim()) {
        JSON.parse(value);
      }
      onSave(value.trim());
      onClose();
    } catch {
      setError('Structured data must be valid JSON.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/45 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-950">{title}</h2>
            <p className="mt-1 text-sm text-neutral-600">Choose a template or edit the JSON-LD directly.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
            aria-label="Close structured data editor"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="overflow-y-auto border-b border-neutral-200 bg-neutral-50 p-4 lg:border-b-0 lg:border-r">
            <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Templates</h3>
            <div className="mt-3 space-y-2">
              {schemaTemplates.map((template) => (
                <button
                  type="button"
                  key={template.type}
                  onClick={() => applyTemplate(template)}
                  className="block w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-left hover:border-pumpkin-300 hover:bg-pumpkin-50"
                >
                  <span className="block text-sm font-bold text-neutral-950">{template.label}</span>
                  <span className="mt-0.5 block text-xs text-neutral-500">{template.type}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-h-0 flex-col p-4">
            <textarea
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setError('');
              }}
              spellCheck={false}
              className="min-h-[420px] flex-1 resize-none rounded-md border border-neutral-300 bg-neutral-950 p-4 font-mono text-sm leading-6 text-neutral-50 outline-none focus:border-pumpkin-500 focus:ring-2 focus:ring-pumpkin-100"
            />
            {error && (
              <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-md border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            className="inline-flex h-10 items-center rounded-md bg-pumpkin-600 px-4 text-sm font-bold text-white hover:bg-pumpkin-700"
          >
            Save Schema
          </button>
        </div>
      </div>
    </div>
  );
}
