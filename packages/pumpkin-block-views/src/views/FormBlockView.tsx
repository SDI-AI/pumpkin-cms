import React, { useRef, useState } from 'react';
import type { FormBlock, FormDefinition, FormFieldDefinition } from 'pumpkin-ts-models';
import { formDefaults, type FormClassNames } from '../defaults/form';
import { mergeClasses } from '../utils/mergeClasses';

export interface FormBlockViewProps {
  block: FormBlock;
  classNames?: FormClassNames;
  formDefinition?: FormDefinition;
  pageSlug?: string;
  onSubmit?: (formType: string, formData: Record<string, string>, pageSlug?: string) => Promise<void> | void;
}

export function FormBlockView({
  block,
  classNames,
  formDefinition,
  pageSlug,
  onSubmit,
}: FormBlockViewProps) {
  const cx = mergeClasses(formDefaults, classNames);
  const { content } = block;
  const fields = getVisibleFields(formDefinition);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onSubmit || !content.formType) return;

    const form = formRef.current ?? event.currentTarget;
    const formData = new FormData(form);
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = String(value);
    });

    setStatus('submitting');
    setMessage('');

    try {
      await onSubmit(content.formType, data, pageSlug);

      if (formDefinition?.submitBehavior === 'redirect' && formDefinition.redirectUrl) {
        window.location.assign(formDefinition.redirectUrl);
        return;
      }

      setStatus('success');
      setMessage(formDefinition?.successMessage || content.successMessage || 'Thanks, your message was sent.');
      formRef.current?.reset();
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <section className={cx.root}>
      <div className={cx.container}>
        {(content.title || content.subtitle || content.description) && (
          <div className={cx.header}>
            {content.title && <h2 className={cx.title}>{content.title}</h2>}
            {content.subtitle && <p className={cx.subtitle}>{content.subtitle}</p>}
            {content.description && <p className={cx.description}>{content.description}</p>}
          </div>
        )}

        {fields.length > 0 ? (
          <form ref={formRef} className={cx.form} onSubmit={handleSubmit}>
            {getHiddenFields(formDefinition).map((field) => (
              <input
                key={field.name}
                type="hidden"
                name={field.name}
                defaultValue={field.defaultValue || ''}
              />
            ))}

            {fields.map((field) => (
              <div key={field.name} className={getFieldWrapperClass(field, cx)}>
                <label className={cx.fieldLabel} htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className={cx.requiredMarker}> *</span>}
                </label>
                {renderField(field, cx)}
                {field.helpText && <p className={cx.fieldHelp}>{field.helpText}</p>}
              </div>
            ))}

            {status !== 'idle' && message && (
              <p
                className={[
                  cx.statusMessage,
                  status === 'success' ? cx.successMessage : '',
                  status === 'error' ? cx.errorMessage : '',
                ].filter(Boolean).join(' ')}
              >
                {message}
              </p>
            )}

            <button type="submit" className={cx.submitButton} disabled={status === 'submitting'}>
              {status === 'submitting'
                ? 'Sending...'
                : formDefinition?.submitButtonText || 'Submit'}
            </button>
          </form>
        ) : (
          <p className={cx.emptyState}>
            {formDefinition ? 'This form has no visible fields.' : 'Form definition unavailable.'}
          </p>
        )}
      </div>
    </section>
  );
}

function renderField(field: FormFieldDefinition, cx: Required<FormClassNames>) {
  const commonProps = {
    id: field.name,
    name: field.name,
    required: field.required,
    defaultValue: field.defaultValue || '',
    placeholder: field.placeholder || undefined,
    autoComplete: field.autocomplete || undefined,
    ...field.attributes,
  };

  switch (field.type) {
    case 'textarea':
      return <textarea {...commonProps} className={cx.fieldTextarea} />;

    case 'select':
      return (
        <select {...commonProps} className={cx.fieldSelect}>
          <option value="">{field.placeholder || 'Select an option'}</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );

    case 'radio':
      return (
        <div className={cx.choiceGroup}>
          {field.options?.map((option) => (
            <label key={option.value} className={cx.choiceLabel}>
              <input type="radio" name={field.name} value={option.value} required={field.required} />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      );

    case 'checkbox':
      return (
        <label className={cx.checkboxLabel}>
          <input type="checkbox" name={field.name} value="true" required={field.required} defaultChecked={field.defaultValue === 'true'} />
          <span>{field.placeholder || field.label}</span>
        </label>
      );

    case 'phone':
      return <input {...commonProps} type="tel" className={cx.fieldInput} />;

    default:
      return <input {...commonProps} type={field.type || 'text'} className={cx.fieldInput} />;
  }
}

function getVisibleFields(formDefinition?: FormDefinition) {
  return getSortedFields(formDefinition).filter((field) => !field.hidden);
}

function getHiddenFields(formDefinition?: FormDefinition) {
  return getSortedFields(formDefinition).filter((field) => field.hidden);
}

function getSortedFields(formDefinition?: FormDefinition) {
  return [...(formDefinition?.fields ?? [])].sort((a, b) => a.order - b.order);
}

function getFieldWrapperClass(field: FormFieldDefinition, cx: Required<FormClassNames>) {
  switch (field.width) {
    case 'half':
      return [cx.fieldWrapper, cx.fieldWrapperHalf].filter(Boolean).join(' ');
    case 'third':
      return [cx.fieldWrapper, cx.fieldWrapperThird].filter(Boolean).join(' ');
    case 'two-thirds':
      return [cx.fieldWrapper, cx.fieldWrapperTwoThirds].filter(Boolean).join(' ');
    default:
      return cx.fieldWrapper;
  }
}
