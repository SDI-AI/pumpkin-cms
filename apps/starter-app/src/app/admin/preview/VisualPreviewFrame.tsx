'use client';

import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import type { FooterClassNames, HeaderClassNames } from 'pumpkin-block-views';
import { PageRenderer } from '@/components/PageRenderer';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import type { EditorToPreviewMessage, PreviewToEditorMessage, VisualPreviewState } from '@/lib/visual-editor-messages';

export function VisualPreviewFrame() {
  const [state, setState] = useState<VisualPreviewState | null>(null);

  useEffect(() => {
    const receive = (event: MessageEvent<EditorToPreviewMessage>) => {
      if (event.source !== window.parent || event.data?.type !== 'pumpkin:preview-state') return;
      setState(event.data.payload);
    };

    window.addEventListener('message', receive);
    send({ type: 'pumpkin:preview-ready' });
    return () => window.removeEventListener('message', receive);
  }, []);

  if (!state) {
    return <div className="flex min-h-screen items-center justify-center bg-neutral-100 text-sm font-semibold text-neutral-500">Loading preview…</div>;
  }

  return (
    <div
      className="min-h-screen bg-white"
      onClickCapture={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest('a')) event.preventDefault();
      }}
      onSubmitCapture={(event) => event.preventDefault()}
    >
      <link
        rel="stylesheet"
        href={state.stylesheetHref}
        integrity={state.stylesheetIntegrity}
        crossOrigin={state.stylesheetIntegrity ? 'anonymous' : undefined}
      />
      <div className="visual-editor-chrome" data-selected={state.navigationSelected ? 'true' : 'false'} onClick={() => send({ type: 'pumpkin:edit-navigation' })}>
        <SiteHeader
          header={state.theme.header}
          menu={state.theme.menu}
          classNames={state.theme.header.classNames as HeaderClassNames}
        />
        <button type="button" className="visual-editor-chrome__control">
          <Menu className="h-4 w-4" aria-hidden="true" /> Edit navigation
        </button>
      </div>
      <main>
        <PageRenderer
          page={state.page}
          blockStyles={state.theme.blockStyles}
          editor={{
            selectedBlockId: state.selectedBlockId,
            onSelectBlock: (blockId) => send({ type: 'pumpkin:select-block', blockId }),
            onBlockAction: (action, blockId) => send({ type: 'pumpkin:block-action', action, blockId }),
            onInsertBlock: (index) => send({ type: 'pumpkin:insert-block', index }),
          }}
        />
      </main>
      <SiteFooter
        footer={state.theme.footer}
        menu={state.theme.menu}
        logoUrl={state.theme.header.logoUrl}
        logoAlt={state.theme.header.logoAlt}
        classNames={state.theme.footer.classNames as FooterClassNames}
      />
    </div>
  );
}

function send(message: PreviewToEditorMessage) {
  window.parent.postMessage(message, window.location.origin);
}
