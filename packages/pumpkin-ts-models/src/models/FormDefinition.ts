/**
 * Input types supported by a FormFieldDefinition.
 */
export type FormFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'hidden';

/**
 * A single option for a select or radio field.
 */
export interface FormFieldOption {
  value: string;
  label: string;
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
  defaultValue?: string;
  /** Options for select/radio fields. */
  options?: FormFieldOption[];
  /** Display order (ascending). */
  order: number;
  /** If true the field is submitted server-side but not rendered to the user. */
  hidden: boolean;
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
  notificationEmails: string[];
  isActive: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
