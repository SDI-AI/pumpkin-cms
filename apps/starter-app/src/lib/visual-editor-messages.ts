import type { Page, Theme } from 'pumpkin-ts-models';

export type PreviewBlockAction = 'move-up' | 'move-down' | 'duplicate' | 'delete';

export interface VisualPreviewState {
  page: Page;
  theme: Theme;
  selectedBlockId: string | null;
  navigationSelected: boolean;
  stylesheetHref: string;
  stylesheetIntegrity?: string;
}

export type EditorToPreviewMessage = {
  type: 'pumpkin:preview-state';
  payload: VisualPreviewState;
};

export type PreviewToEditorMessage =
  | { type: 'pumpkin:preview-ready' }
  | { type: 'pumpkin:select-block'; blockId: string }
  | { type: 'pumpkin:block-action'; action: PreviewBlockAction; blockId: string }
  | { type: 'pumpkin:insert-block'; index: number }
  | { type: 'pumpkin:edit-navigation' };

export function isPreviewMessage(value: unknown): value is PreviewToEditorMessage {
  if (!value || typeof value !== 'object') return false;
  const type = (value as { type?: unknown }).type;
  return typeof type === 'string' && type.startsWith('pumpkin:');
}
