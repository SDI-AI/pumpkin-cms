/**
 * Input types supported by a FormFieldDefinition.
 */
export type FormFieldType = 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'hidden';
export type FormSubmitBehavior = 'message' | 'redirect';
export type FormFieldWidth = 'full' | 'half' | 'third' | 'two-thirds';
/**
 * A single option for a select or radio field.
 */
export interface FormFieldOption {
    value: string;
    label: string;
}
export interface FormFieldValidation {
    minLength?: number;
    maxLength?: number;
    pattern: string;
    min?: number;
    max?: number;
    message: string;
}
export interface FormNotificationSettings {
    enabled: boolean;
    replyToField: string;
    subjectTemplate: string;
}
export interface FormSpamProtection {
    honeypotFieldName: string;
    rejectWhenHoneypotFilled: boolean;
    requireConsent: boolean;
    consentFieldName: string;
}
export interface FormRateLimit {
    enabled: boolean;
    maxSubmissions: number;
    windowSeconds: number;
}
/**
 * Describes one field within a FormDefinition.
 * The `name` property is the key written into FormEntry.formData on submission.
 */
export interface FormFieldDefinition {
    /** Key used in FormEntry.formData, e.g. "email". */
    name: string;
    /** Display label shown to the user, e.g. "Email Address". */
    label: string;
    type: FormFieldType;
    required: boolean;
    placeholder: string;
    helpText: string;
    defaultValue?: string;
    autocomplete: string;
    /** Options for select/radio fields. */
    options?: FormFieldOption[];
    /** Display order (ascending). */
    order: number;
    /** If true the field is submitted server-side but not rendered to the user. */
    hidden: boolean;
    /** Layout width hint for form renderers. */
    width: FormFieldWidth | string;
    validation: FormFieldValidation;
    attributes: Record<string, string>;
}
/**
 * Defines the schema for a dynamic form.
 * The `type` property (e.g. "contact_submission") is the linking key between a
 * FormDefinition and its submitted FormEntry records.
 */
export interface FormDefinition {
    id: string;
    formDefinitionId: string;
    tenantId: string;
    /** Human-readable name, e.g. "Contact Form". */
    name: string;
    /**
     * Machine-readable slug matching FormEntry.type,
     * e.g. "contact_submission".
     */
    type: string;
    description: string;
    fields: FormFieldDefinition[];
    submitButtonText: string;
    successMessage: string;
    submitBehavior: FormSubmitBehavior | string;
    redirectUrl: string;
    notificationEmails: string[];
    notifications: FormNotificationSettings;
    spamProtection: FormSpamProtection;
    rateLimit: FormRateLimit;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
//# sourceMappingURL=FormDefinition.d.ts.map