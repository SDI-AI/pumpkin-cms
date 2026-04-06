/**
 * Additional metadata stored alongside a form submission.
 * `status` and `source` have been promoted to top-level fields on FormEntry.
 */
export interface FormEntryMetadata {
  referrer: string;
  tags: string[];
}

/**
 * Represents a submitted form entry stored in the FormEntry container.
 *
 * The `type` property (e.g. "contact_submission") links this entry to its
 * FormDefinition. Field values are stored in `formData` keyed by the
 * FormFieldDefinition `name`.
 */
export interface FormEntry {
  id: string;
  /**
   * Machine-readable form type matching FormDefinition.type,
   * e.g. "contact_submission".
   */
  type: string;
  tenantId: string;
  /** References the parent FormDefinition.formDefinitionId. */
  formDefinitionId: string;
  pageSlug: string;
  /**
   * Key/value pairs of submitted field data, keyed by FormFieldDefinition.name.
   * Values may be null for optional fields left blank.
   */
  formData: Record<string, unknown>;
  submittedAt: string; // ISO 8601
  /** Submission status: new | read | actioned | archived */
  status: string;
  /** Submission source, e.g. "website_contact_form" or "website_form". */
  source: string;
  ipAddress: string;
  userAgent: string;
  metadata: FormEntryMetadata;
}
