'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Copy, Eye, Plus, Save, Trash2, Wand2 } from 'lucide-react';
import type { FormDefinition, FormFieldDefinition, FormFieldType, FormFieldWidth } from 'pumpkin-ts-models';

interface FormDefinitionEditorProps {
  initialDefinition: FormDefinition;
  mode: 'create' | 'edit';
}

const fieldTypes: FormFieldType[] = ['text', 'email', 'phone', 'textarea', 'select', 'checkbox', 'radio', 'hidden'];
const fieldWidths: FormFieldWidth[] = ['full', 'half', 'third', 'two-thirds'];
const quickFields: Array<{ label: string; name: string; type: FormFieldType; placeholder?: string; helpText?: string; width?: FormFieldWidth }> = [
  { label: 'Name', name: 'name', type: 'text', placeholder: 'Jane Smith', width: 'half' },
  { label: 'Email', name: 'email', type: 'email', placeholder: 'jane@example.com', width: 'half' },
  { label: 'Phone', name: 'phone', type: 'phone', placeholder: '(555) 123-4567', width: 'half' },
  { label: 'Message', name: 'message', type: 'textarea', placeholder: 'How can we help?', width: 'full' },
  { label: 'Consent', name: 'consent', type: 'checkbox', placeholder: 'I agree to be contacted about this request.', width: 'full' },
  { label: 'Source', name: 'source', type: 'hidden', width: 'full' },
];

export function FormDefinitionEditor({ initialDefinition, mode }: FormDefinitionEditorProps) {
  const router = useRouter();
  const normalizedInitialDefinition = useMemo(() => normalizeFormDefinition(initialDefinition), [initialDefinition]);
  const [definition, setDefinition] = useState(normalizedInitialDefinition);
  const [advancedJson, setAdvancedJson] = useState(() => JSON.stringify(normalizedInitialDefinition, null, 2));
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

  const addQuickField = (preset: (typeof quickFields)[number]) => {
    setDefinition((current) => {
      const nextIndex = current.fields.length + 1;
      const field = {
        ...createField(createUniqueFieldName(preset.name, current.fields), nextIndex, preset.type),
        label: preset.label,
        placeholder: preset.placeholder || '',
        helpText: preset.helpText || '',
        width: preset.width || 'full',
      };

      return syncJson({ ...current, fields: [...current.fields, field] });
    });
  };

  const removeField = (name: string) => {
    setDefinition((current) => syncJson({
      ...current,
      fields: current.fields.filter((field) => field.name !== name),
    }));
  };

  const duplicateField = (name: string) => {
    setDefinition((current) => {
      const source = current.fields.find((field) => field.name === name);
      if (!source) return current;

      const nextOrder = current.fields.length + 1;
      const field = {
        ...source,
        name: createUniqueFieldName(`${source.name}_copy`, current.fields),
        label: `${source.label} Copy`,
        order: nextOrder,
      };

      return syncJson({ ...current, fields: normalizeFieldOrder([...current.fields, field]) });
    });
  };

  const moveField = (name: string, direction: 'up' | 'down') => {
    setDefinition((current) => {
      const fields = normalizeFieldOrder(current.fields);
      const index = fields.findIndex((field) => field.name === name);
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      if (index < 0 || targetIndex < 0 || targetIndex >= fields.length) {
        return current;
      }

      [fields[index], fields[targetIndex]] = [fields[targetIndex], fields[index]];
      return syncJson({ ...current, fields: normalizeFieldOrder(fields) });
    });
  };

  const applyAdvancedJson = () => {
    setError('');
    try {
      setDefinition(syncJson(normalizeFormDefinition(JSON.parse(advancedJson) as FormDefinition)));
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
        fields: normalizeFieldOrder(definition.fields),
        notificationEmails: definition.notificationEmails.map((email) => email.trim()).filter(Boolean),
        updatedAt: new Date().toISOString(),
      };
      const validationErrors = validateFormDefinition(payload);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(' '));
      }

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

      const saved = normalizeFormDefinition((await response.json()) as FormDefinition);
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
          <TextField label="Success Redirect URL" value={definition.redirectUrl} onChange={(value) => update('redirectUrl', value)} />
          <TextField
            label="Notification Emails"
            value={definition.notificationEmails.join(', ')}
            onChange={(value) => update('notificationEmails', splitCommaList(value))}
          />
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
        <h2 className="text-base font-bold text-neutral-950">Submit Settings</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Checkbox
            label="Send Notifications"
            checked={definition.notifications.enabled}
            onChange={(checked) => update('notifications', { ...definition.notifications, enabled: checked })}
          />
          <TextField
            label="Reply-To Field"
            value={definition.notifications.replyToField}
            onChange={(value) => update('notifications', { ...definition.notifications, replyToField: value })}
          />
          <TextField
            label="Subject Template"
            value={definition.notifications.subjectTemplate}
            onChange={(value) => update('notifications', { ...definition.notifications, subjectTemplate: value })}
          />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
            <h3 className="text-sm font-bold text-neutral-950">Spam Protection</h3>
            <div className="mt-3 space-y-3">
              <TextField
                label="Honeypot Field"
                value={definition.spamProtection.honeypotFieldName}
                onChange={(value) => update('spamProtection', { ...definition.spamProtection, honeypotFieldName: value })}
              />
              <TextField
                label="Consent Field"
                value={definition.spamProtection.consentFieldName}
                onChange={(value) => update('spamProtection', { ...definition.spamProtection, consentFieldName: value })}
              />
              <div className="flex flex-wrap gap-4">
                <Checkbox
                  label="Reject Honeypot"
                  checked={definition.spamProtection.rejectWhenHoneypotFilled}
                  onChange={(checked) => update('spamProtection', { ...definition.spamProtection, rejectWhenHoneypotFilled: checked })}
                />
                <Checkbox
                  label="Require Consent"
                  checked={definition.spamProtection.requireConsent}
                  onChange={(checked) => update('spamProtection', { ...definition.spamProtection, requireConsent: checked })}
                />
              </div>
              <label className="block">
                <span className="text-sm font-semibold text-neutral-800">CAPTCHA</span>
                <select
                  value={definition.spamProtection.captcha.mode}
                  onChange={(event) => update('spamProtection', {
                    ...definition.spamProtection,
                    captcha: { ...definition.spamProtection.captcha, mode: event.target.value },
                  })}
                  className="mt-2 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm"
                >
                  <option value="inherit">Use tenant default</option>
                  <option value="required">Required</option>
                  <option value="disabled">Disabled</option>
                </select>
              </label>
              <TextField
                label="CAPTCHA Action"
                value={definition.spamProtection.captcha.action}
                onChange={(value) => update('spamProtection', {
                  ...definition.spamProtection,
                  captcha: { ...definition.spamProtection.captcha, action: value },
                })}
              />
            </div>
          </div>

          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
            <h3 className="text-sm font-bold text-neutral-950">Rate Limit</h3>
            <div className="mt-3 space-y-3">
              <Checkbox
                label="Enable Rate Limit"
                checked={definition.rateLimit.enabled}
                onChange={(checked) => update('rateLimit', { ...definition.rateLimit, enabled: checked })}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Max Submissions"
                  value={String(definition.rateLimit.maxSubmissions)}
                  onChange={(value) => update('rateLimit', { ...definition.rateLimit, maxSubmissions: Number.parseInt(value, 10) || 0 })}
                />
                <TextField
                  label="Window Seconds"
                  value={String(definition.rateLimit.windowSeconds)}
                  onChange={(value) => update('rateLimit', { ...definition.rateLimit, windowSeconds: Number.parseInt(value, 10) || 0 })}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-950">Fields</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {quickFields.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => addQuickField(preset)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={addField}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-neutral-300 px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Add Field</span>
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {sortedFields.map((field, index) => (
            <div key={field.name} className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-950">{field.label || field.name}</h3>
                  <p className="text-xs text-neutral-500">{field.name} - {field.type}</p>
                </div>
                <div className="flex items-center gap-1">
                  <IconButton label="Move up" disabled={index === 0} onClick={() => moveField(field.name, 'up')}>
                    <ChevronUp className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                  <IconButton label="Move down" disabled={index === sortedFields.length - 1} onClick={() => moveField(field.name, 'down')}>
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                  <IconButton label="Duplicate" onClick={() => duplicateField(field.name)}>
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                  <IconButton label={`Remove ${field.label}`} danger onClick={() => removeField(field.name)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-5">
                <TextField label="Label" value={field.label} onChange={(value) => updateField(field.name, { label: value })} />
                <TextField label="Name" value={field.name} onChange={(value) => updateField(field.name, { name: toFieldName(value) })} />
                <SelectControl
                  label="Type"
                  value={field.type}
                  options={fieldTypes}
                  onChange={(value) => updateField(field.name, { type: value as FormFieldType })}
                />
                <SelectControl
                  label="Width"
                  value={field.width}
                  options={fieldWidths}
                  onChange={(value) => updateField(field.name, { width: value })}
                />
                <TextField label="Order" value={String(field.order)} onChange={(value) => updateField(field.name, { order: Number(value) || 0 })} />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <TextField label="Placeholder" value={field.placeholder} onChange={(value) => updateField(field.name, { placeholder: value })} />
                <TextField label="Help Text" value={field.helpText} onChange={(value) => updateField(field.name, { helpText: value })} />
                <TextField label="Default Value" value={field.defaultValue || ''} onChange={(value) => updateField(field.name, { defaultValue: value })} />
                <TextField label="Autocomplete" value={field.autocomplete} onChange={(value) => updateField(field.name, { autocomplete: value })} />
                <TextAreaField
                  label="Options"
                  value={(field.options ?? []).map((option) => `${option.value}:${option.label}`).join('\n')}
                  onChange={(value) => updateField(field.name, { options: parseOptions(value) })}
                />
                <TextField
                  label="Attributes"
                  value={formatAttributes(field.attributes)}
                  onChange={(value) => updateField(field.name, { attributes: parseAttributes(value) })}
                />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <TextField label="Min Length" value={String(field.validation.minLength ?? '')} onChange={(value) => updateField(field.name, { validation: { ...field.validation, minLength: parseOptionalNumber(value) } })} />
                <TextField label="Max Length" value={String(field.validation.maxLength ?? '')} onChange={(value) => updateField(field.name, { validation: { ...field.validation, maxLength: parseOptionalNumber(value) } })} />
                <TextField label="Min" value={String(field.validation.min ?? '')} onChange={(value) => updateField(field.name, { validation: { ...field.validation, min: parseOptionalNumber(value) } })} />
                <TextField label="Max" value={String(field.validation.max ?? '')} onChange={(value) => updateField(field.name, { validation: { ...field.validation, max: parseOptionalNumber(value) } })} />
                <TextField label="Pattern" value={field.validation.pattern} onChange={(value) => updateField(field.name, { validation: { ...field.validation, pattern: value } })} />
                <TextField label="Validation Message" value={field.validation.message} onChange={(value) => updateField(field.name, { validation: { ...field.validation, message: value } })} />
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
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-neutral-500" aria-hidden="true" />
          <h2 className="text-base font-bold text-neutral-950">Preview</h2>
        </div>
        <FormPreview definition={definition} fields={sortedFields} />
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
          className="inline-flex h-10 items-center gap-2 rounded-md bg-pumpkin-600 px-4 text-sm font-bold text-white hover:bg-pumpkin-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {saving ? 'Saving...' : 'Save Form'}
        </button>
      </div>
    </div>
  );
}

export function createFormDefinition(tenantId: string): FormDefinition {
  const now = new Date().toISOString();
  return normalizeFormDefinition({
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
      captcha: { mode: 'inherit', provider: 'none', siteKey: '', action: 'form_submit' },
    },
    rateLimit: { enabled: false, maxSubmissions: 5, windowSeconds: 3600 },
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
}

function normalizeFormDefinition(definition: FormDefinition): FormDefinition {
  const now = new Date().toISOString();
  const defaultNotifications: FormDefinition['notifications'] = {
    enabled: false,
    replyToField: 'email',
    subjectTemplate: '',
  };
  const defaultSpamProtection: FormDefinition['spamProtection'] = {
    honeypotFieldName: 'company',
    rejectWhenHoneypotFilled: true,
    requireConsent: false,
    consentFieldName: 'consent',
    captcha: { mode: 'inherit', provider: 'none', siteKey: '', action: 'form_submit' },
  };
  const defaultRateLimit: FormDefinition['rateLimit'] = {
    enabled: false,
    maxSubmissions: 5,
    windowSeconds: 3600,
  };

  return {
    ...definition,
    id: definition.id || definition.formDefinitionId || 'new-form',
    formDefinitionId: definition.formDefinitionId || definition.id || 'new-form',
    name: definition.name || 'New Form',
    type: definition.type || 'new_form',
    description: definition.description || '',
    fields: normalizeFieldOrder((definition.fields || []).map(normalizeField)),
    submitButtonText: definition.submitButtonText || 'Submit',
    successMessage: definition.successMessage || 'Thanks, your message was sent.',
    submitBehavior: definition.submitBehavior || 'message',
    redirectUrl: definition.redirectUrl || '',
    notificationEmails: definition.notificationEmails || [],
    notifications: { ...defaultNotifications, ...definition.notifications },
    spamProtection: {
      ...defaultSpamProtection,
      ...definition.spamProtection,
      captcha: { ...defaultSpamProtection.captcha, ...definition.spamProtection?.captcha },
    },
    rateLimit: { ...defaultRateLimit, ...definition.rateLimit },
    isActive: definition.isActive ?? true,
    createdAt: definition.createdAt || now,
    updatedAt: definition.updatedAt || now,
  };
}

function normalizeField(field: FormFieldDefinition): FormFieldDefinition {
  const defaultValidation: FormFieldDefinition['validation'] = {
    pattern: '',
    message: '',
  };

  return {
    ...field,
    name: toFieldName(field.name || field.label || 'field'),
    label: field.label || toTitle(field.name || 'field'),
    type: field.type || 'text',
    required: field.required ?? false,
    placeholder: field.placeholder || '',
    helpText: field.helpText || '',
    autocomplete: field.autocomplete || '',
    order: field.order || 0,
    hidden: field.hidden ?? field.type === 'hidden',
    width: field.width || 'full',
    validation: { ...defaultValidation, ...field.validation },
    attributes: field.attributes || {},
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

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-neutral-800">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-20 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
      />
    </label>
  );
}

function FormPreview({
  definition,
  fields,
}: {
  definition: FormDefinition;
  fields: FormFieldDefinition[];
}) {
  const visibleFields = fields.filter((field) => !field.hidden);

  return (
    <div className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-neutral-950">{definition.name || 'Untitled Form'}</h3>
        {definition.description && <p className="mt-1 text-sm text-neutral-600">{definition.description}</p>}
      </div>

      {visibleFields.length === 0 ? (
        <p className="text-sm text-neutral-600">No visible fields.</p>
      ) : (
        <div className="grid grid-cols-12 gap-3">
          {visibleFields.map((field) => (
            <div key={field.name} className={previewWidthClass(field.width)}>
              <label className="block text-sm font-semibold text-neutral-800">
                {field.label || field.name}
                {field.required && <span className="text-red-500"> *</span>}
              </label>
              <PreviewInput field={field} />
              {field.helpText && <p className="mt-1 text-xs text-neutral-500">{field.helpText}</p>}
            </div>
          ))}
          <div className="col-span-12">
            <button
              type="button"
              className="inline-flex h-10 items-center rounded-md bg-pumpkin-600 px-4 text-sm font-bold text-white"
            >
              {definition.submitButtonText || 'Submit'}
            </button>
            {definition.successMessage && <p className="mt-2 text-xs text-neutral-500">{definition.successMessage}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewInput({ field }: { field: FormFieldDefinition }) {
  const inputClass = 'mt-2 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-700';
  const placeholder = field.placeholder || undefined;

  if (field.type === 'textarea') {
    return <textarea className="mt-2 min-h-24 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700" placeholder={placeholder} disabled />;
  }

  if (field.type === 'select') {
    return (
      <select className={inputClass} disabled>
        <option>{placeholder || 'Select an option'}</option>
        {(field.options ?? []).map((option) => <option key={option.value}>{option.label}</option>)}
      </select>
    );
  }

  if (field.type === 'radio') {
    return (
      <div className="mt-2 grid gap-2">
        {(field.options ?? []).map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="radio" disabled />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <label className="mt-2 flex items-start gap-2 text-sm text-neutral-700">
        <input type="checkbox" disabled />
        <span>{field.placeholder || field.label}</span>
      </label>
    );
  }

  return <input className={inputClass} type={field.type === 'phone' ? 'tel' : field.type} placeholder={placeholder} disabled />;
}

function SelectControl({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: readonly string[];
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-neutral-800">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-10 w-full rounded-md border border-neutral-300 px-3 text-sm"
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
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

function IconButton({
  children,
  danger,
  disabled,
  label,
  onClick,
}: {
  children: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={[
        'inline-flex h-9 w-9 items-center justify-center rounded-md border bg-white disabled:cursor-not-allowed disabled:opacity-35',
        danger ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function parseOptions(value: string) {
  return value
    .split(/[\n,]/)
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

function validateFormDefinition(definition: FormDefinition) {
  const errors: string[] = [];
  const fieldNames = definition.fields.map((field) => field.name.trim()).filter(Boolean);
  const duplicateNames = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);

  if (!definition.formDefinitionId.trim()) errors.push('Form ID is required.');
  if (!definition.type.trim()) errors.push('Type is required.');
  if (definition.submitBehavior === 'redirect' && !isSafeRedirectUrl(definition.redirectUrl)) {
    errors.push('Success redirect must be a relative site path or an absolute HTTP(S) URL.');
  }
  if (!/^[a-zA-Z0-9_-]{1,32}$/.test(definition.spamProtection.captcha.action)) {
    errors.push('CAPTCHA action must use 1-32 letters, numbers, underscores, or hyphens.');
  }
  if (definition.fields.some((field) => !field.name.trim())) errors.push('Every field needs a name.');
  if (duplicateNames.length > 0) errors.push(`Duplicate field names: ${Array.from(new Set(duplicateNames)).join(', ')}.`);

  const fieldsWithoutLabels = definition.fields.filter((field) => !field.hidden && !field.label.trim());
  if (fieldsWithoutLabels.length > 0) {
    errors.push(`Visible fields need labels: ${fieldsWithoutLabels.map((field) => field.name || '(unnamed)').join(', ')}.`);
  }

  const optionFieldsWithoutOptions = definition.fields.filter((field) =>
    (field.type === 'select' || field.type === 'radio') &&
    (field.options ?? []).length === 0,
  );
  if (optionFieldsWithoutOptions.length > 0) {
    errors.push(`Select and radio fields need options: ${optionFieldsWithoutOptions.map((field) => field.name).join(', ')}.`);
  }

  return errors;
}

function isSafeRedirectUrl(value: string) {
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function previewWidthClass(width: string) {
  switch (width) {
    case 'half':
      return 'col-span-12 md:col-span-6';
    case 'third':
      return 'col-span-12 md:col-span-4';
    case 'two-thirds':
      return 'col-span-12 md:col-span-8';
    default:
      return 'col-span-12';
  }
}

function parseAttributes(value: string) {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((attributes, part) => {
      const [key, ...valueParts] = part.split(':');
      const attributeKey = key.trim();
      if (!attributeKey) return attributes;

      attributes[attributeKey] = valueParts.join(':').trim();
      return attributes;
    }, {});
}

function formatAttributes(attributes: Record<string, string>) {
  return Object.entries(attributes || {})
    .map(([key, value]) => `${key}:${value}`)
    .join(', ');
}

function splitCommaList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function normalizeFieldOrder(fields: FormFieldDefinition[]) {
  return [...fields]
    .sort((a, b) => a.order - b.order)
    .map((field, index) => ({ ...field, order: index + 1 }));
}

function createUniqueFieldName(baseName: string, fields: FormFieldDefinition[]) {
  const existingNames = new Set(fields.map((field) => field.name));
  const normalizedBase = toFieldName(baseName) || 'field';
  let name = normalizedBase;
  let index = 2;

  while (existingNames.has(name)) {
    name = `${normalizedBase}_${index}`;
    index += 1;
  }

  return name;
}

function toFieldName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toTitle(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
