'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import type { FormDefinition, FormFieldDefinition, FormFieldType, FormFieldWidth } from 'pumpkin-ts-models';

interface FormDefinitionEditorProps {
  initialDefinition: FormDefinition;
  mode: 'create' | 'edit';
}

const fieldTypes: FormFieldType[] = ['text', 'email', 'phone', 'textarea', 'select', 'checkbox', 'radio', 'hidden'];
const fieldWidths: FormFieldWidth[] = ['full', 'half', 'third', 'two-thirds'];

export function FormDefinitionEditor({ initialDefinition, mode }: FormDefinitionEditorProps) {
  const router = useRouter();
  const [definition, setDefinition] = useState(initialDefinition);
  const [advancedJson, setAdvancedJson] = useState(() => JSON.stringify(initialDefinition, null, 2));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const sortedFields = useMemo(
    () => [...definition.fields].sort((a, b) => a.order - b.order),
    [definition.fields],
  );

  const update = <K extends keyof FormDefinition>(key: K, value: FormDefinition[K]) => {
    setDefinition((current) => syncJson({ ...current, [key]: value }));
  };

  const updateField = (name: string, updates: Partial<FormFieldDefinition>) => {
    setDefinition((current) => syncJson({
      ...current,
      fields: current.fields.map((field) => field.name === name ? { ...field, ...updates } : field),
    }));
  };

  const addField = () => {
    const nextIndex = definition.fields.length + 1;
    const field = createField(`field_${nextIndex}`, nextIndex);
    setDefinition((current) => syncJson({ ...current, fields: [...current.fields, field] }));
  };

  const removeField = (name: string) => {
    setDefinition((current) => syncJson({
      ...current,
      fields: current.fields.filter((field) => field.name !== name),
    }));
  };

  const applyAdvancedJson = () => {
    setError('');
    try {
      setDefinition(JSON.parse(advancedJson) as FormDefinition);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON.');
    }
  };

  const save = async () => {
    setMessage('');
    setError('');
    setSaving(true);

    try {
      const payload = {
        ...definition,
        id: definition.id || definition.formDefinitionId,
        formDefinitionId: definition.formDefinitionId || definition.id,
        updatedAt: new Date().toISOString(),
      };
      const url = mode === 'create'
        ? '/api/admin/forms/definitions'
        : `/api/admin/forms/definitions/${encodeURIComponent(initialDefinition.formDefinitionId)}`;
      const response = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message || 'Unable to save form definition.');
      }

      const saved = (await response.json()) as FormDefinition;
      setDefinition(syncJson(saved));
      setMessage('Form definition saved.');
      router.replace(`/admin/forms/${encodeURIComponent(saved.formDefinitionId)}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save form definition.');
    } finally {
      setSaving(false);
    }
  };

  const syncJson = (next: FormDefinition) => {
    setAdvancedJson(JSON.stringify(next, null, 2));
    return next;
  };

  return (
    <div className="space-y-6">
      {(message || error) && (
        <p className={[
          'rounded-md border px-3 py-2 text-sm',
          error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700',
        ].join(' ')}>
          {error || message}
        </p>
      )}

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-neutral-950">Form Details</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField label="Name" value={definition.name} onChange={(value) => update('name', value)} />
          <TextField label="Form ID" value={definition.formDefinitionId} onChange={(value) => update('formDefinitionId', value)} disabled={mode === 'edit'} />
          <TextField label="Type" value={definition.type} onChange={(value) => update('type', value.trim().toLowerCase())} />
          <TextField label="Submit Button" value={definition.submitButtonText} onChange={(value) => update('submitButtonText', value)} />
          <TextField label="Success Message" value={definition.successMessage} onChange={(value) => update('successMessage', value)} />
          <label className="block">
            <span className="text-sm font-semibold text-neutral-800">Submit Behavior</span>
            <select
              value={definition.submitBehavior}
              onChange={(event) => update('submitBehavior', event.target.value)}
              className="mt-2 h-10 w-full rounded-md border border-neutral-300 px-3 text-sm"
            >
              <option value="message">Message</option>
              <option value="redirect">Redirect</option>
            </select>
          </label>
          <TextField label="Redirect URL" value={definition.redirectUrl} onChange={(value) => update('redirectUrl', value)} />
          <label className="flex items-center gap-2 pt-7">
            <input
              type="checkbox"
              checked={definition.isActive}
              onChange={(event) => update('isActive', event.target.checked)}
            />
            <span className="text-sm font-semibold text-neutral-800">Active</span>
          </label>
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-neutral-800">Description</span>
          <textarea
            value={definition.description}
            onChange={(event) => update('description', event.target.value)}
            className="mt-2 min-h-24 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-950">Fields</h2>
          <button
            type="button"
            onClick={addField}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-neutral-300 px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Add Field</span>
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {sortedFields.map((field) => (
            <div key={field.name} className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
              <div className="grid gap-3 md:grid-cols-6">
                <TextField label="Label" value={field.label} onChange={(value) => updateField(field.name, { label: value })} />
                <TextField label="Name" value={field.name} onChange={(value) => updateField(field.name, { name: value.trim() })} />
                <label className="block">
                  <span className="text-sm font-semibold text-neutral-800">Type</span>
                  <select
                    value={field.type}
                    onChange={(event) => updateField(field.name, { type: event.target.value as FormFieldType })}
                    className="mt-2 h-10 w-full rounded-md border border-neutral-300 px-3 text-sm"
                  >
                    {fieldTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-neutral-800">Width</span>
                  <select
                    value={field.width}
                    onChange={(event) => updateField(field.name, { width: event.target.value })}
                    className="mt-2 h-10 w-full rounded-md border border-neutral-300 px-3 text-sm"
                  >
                    {fieldWidths.map((width) => <option key={width} value={width}>{width}</option>)}
                  </select>
                </label>
                <TextField label="Order" value={String(field.order)} onChange={(value) => updateField(field.name, { order: Number(value) || 0 })} />
                <button
                  type="button"
                  onClick={() => removeField(field.name)}
                  className="mt-7 inline-flex h-10 items-center justify-center rounded-md border border-red-200 bg-white text-red-700 hover:bg-red-50"
                  aria-label={`Remove ${field.label}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <TextField label="Placeholder" value={field.placeholder} onChange={(value) => updateField(field.name, { placeholder: value })} />
                <TextField label="Help Text" value={field.helpText} onChange={(value) => updateField(field.name, { helpText: value })} />
                <TextField
                  label="Options"
                  value={(field.options ?? []).map((option) => `${option.value}:${option.label}`).join(', ')}
                  onChange={(value) => updateField(field.name, { options: parseOptions(value) })}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-4">
                <Checkbox label="Required" checked={field.required} onChange={(checked) => updateField(field.name, { required: checked })} />
                <Checkbox label="Hidden" checked={field.hidden} onChange={(checked) => updateField(field.name, { hidden: checked })} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-950">Advanced JSON</h2>
          <button
            type="button"
            onClick={applyAdvancedJson}
            className="inline-flex h-9 items-center rounded-md border border-neutral-300 px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Apply JSON
          </button>
        </div>
        <textarea
          value={advancedJson}
          onChange={(event) => setAdvancedJson(event.target.value)}
          spellCheck={false}
          className="mt-4 min-h-80 w-full rounded-md border border-neutral-300 bg-neutral-950 p-4 font-mono text-sm leading-6 text-neutral-50"
        />
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex h-10 items-center rounded-md bg-pumpkin-600 px-4 text-sm font-bold text-white hover:bg-pumpkin-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Form'}
        </button>
      </div>
    </div>
  );
}

export function createFormDefinition(tenantId: string): FormDefinition {
  const now = new Date().toISOString();
  return {
    id: 'new-form',
    formDefinitionId: 'new-form',
    tenantId,
    name: 'New Form',
    type: 'new_form',
    description: '',
    fields: [createField('name', 1), createField('email', 2, 'email')],
    submitButtonText: 'Submit',
    successMessage: 'Thanks, your message was sent.',
    submitBehavior: 'message',
    redirectUrl: '',
    notificationEmails: [],
    notifications: { enabled: false, replyToField: 'email', subjectTemplate: '' },
    spamProtection: {
      honeypotFieldName: 'company',
      rejectWhenHoneypotFilled: true,
      requireConsent: false,
      consentFieldName: 'consent',
    },
    rateLimit: { enabled: false, maxSubmissions: 5, windowSeconds: 3600 },
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

function createField(name: string, order: number, type: FormFieldType = 'text'): FormFieldDefinition {
  return {
    name,
    label: toTitle(name),
    type,
    required: type !== 'hidden',
    placeholder: '',
    helpText: '',
    autocomplete: type === 'email' ? 'email' : '',
    order,
    hidden: type === 'hidden',
    width: 'full',
    validation: { pattern: '', message: '' },
    attributes: {},
  };
}

function TextField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-neutral-800">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="mt-2 h-10 w-full rounded-md border border-neutral-300 px-3 text-sm disabled:bg-neutral-100"
      />
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-800">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function parseOptions(value: string) {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [valuePart, labelPart] = part.split(':');
      const optionValue = valuePart.trim();
      return {
        value: optionValue,
        label: (labelPart || valuePart).trim(),
      };
    });
}

function toTitle(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
