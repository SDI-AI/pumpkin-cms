import type { FormDefinition, FormFieldDefinition, FormFieldType } from 'pumpkin-ts-models';

export function createFormDefinition(tenantId: string): FormDefinition {
  const now = new Date().toISOString();

  return {
    id: 'new-form',
    formDefinitionId: 'new-form',
    tenantId,
    name: 'New Form',
    type: 'new_form',
    description: '',
    fields: [createInitialField('name', 1), createInitialField('email', 2, 'email')],
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
  };
}

function createInitialField(
  name: string,
  order: number,
  type: FormFieldType = 'text',
): FormFieldDefinition {
  return {
    name,
    label: name.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
    type,
    required: true,
    placeholder: '',
    helpText: '',
    autocomplete: type === 'email' ? 'email' : '',
    order,
    hidden: false,
    width: 'full',
    validation: { pattern: '', message: '' },
    attributes: {},
  };
}
