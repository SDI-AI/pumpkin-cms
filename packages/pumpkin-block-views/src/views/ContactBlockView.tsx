import React from 'react';
import type { ContactBlock } from 'pumpkin-ts-models';
import { contactDefaults, type ContactClassNames } from '../defaults/contact';
import { mergeClasses } from '../utils/mergeClasses';

export interface ContactBlockViewProps {
  block: ContactBlock;
  classNames?: ContactClassNames;
  /** Called when the contact form is submitted. The consumer handles actual submission logic. */
  onSubmit?: (formData: Record<string, string>) => void;
}

export function ContactBlockView({ block, classNames, onSubmit }: ContactBlockViewProps) {
  const cx = mergeClasses(contactDefaults, classNames);
  const { content } = block;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!onSubmit) return;
    const fd = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    fd.forEach((value, key) => { data[key] = String(value); });
    onSubmit(data);
  };

  return (
    <section className={cx.root}>
      <div className={cx.container}>
        {/* Info column */}
        <div className={cx.infoSection}>
          {content.title && <h2 className={cx.title}>{content.title}</h2>}
          {content.subtitle && <p className={cx.subtitle}>{content.subtitle}</p>}
          {content.address && (
            <div className={cx.infoItem}>
              <span className={cx.infoLabel}>Address</span>
              <span className={cx.infoValue}>{content.address}</span>
            </div>
          )}
          {content.phone && (
            <div className={cx.infoItem}>
              <span className={cx.infoLabel}>Phone</span>
              <a href={`tel:${content.phone}`} className={cx.infoValue}>{content.phone}</a>
            </div>
          )}
          {content.email && (
            <div className={cx.infoItem}>
              <span className={cx.infoLabel}>Email</span>
              <a href={`mailto:${content.email}`} className={cx.infoValue}>{content.email}</a>
            </div>
          )}
          {content.hours && (
            <div className={cx.infoItem}>
              <span className={cx.infoLabel}>Hours</span>
              <span className={cx.infoValue}>{content.hours}</span>
            </div>
          )}
          {content.socialLinks?.length > 0 && (
            <div className={cx.socialLinks}>
              {content.socialLinks.map((link, i) => (
                <a key={i} href={link.url} className={cx.socialLink} aria-label={link.platform} target="_blank" rel="noopener noreferrer">
                  {link.icon ? <img src={link.icon} alt={link.platform} className="w-4 h-4" /> : link.platform}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Form column */}
        {content.formFields?.length > 0 && (
          <form className={cx.form} onSubmit={handleSubmit}>
            {content.formFields.map((field, i) => (
              <div key={i} className={cx.fieldWrapper}>
                <label className={cx.fieldLabel}>{field.label}{field.required && ' *'}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    name={field.label}
                    placeholder={field.placeholder}
                    required={field.required}
                    className={cx.fieldTextarea}
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    name={field.label}
                    placeholder={field.placeholder}
                    required={field.required}
                    className={cx.fieldInput}
                  />
                )}
              </div>
            ))}
            <button type="submit" className={cx.submitButton}>
              {content.submitButtonText || 'Submit'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
