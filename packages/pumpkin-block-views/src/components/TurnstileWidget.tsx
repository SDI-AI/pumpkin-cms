'use client';

import React, { useEffect, useRef } from 'react';

interface TurnstileApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export interface TurnstileWidgetProps {
  siteKey: string;
  action: string;
  onTokenChange: (token: string) => void;
  resetSignal?: number;
}

let turnstileLoader: Promise<TurnstileApi> | null = null;

export function TurnstileWidget({ siteKey, action, onTokenChange, resetSignal = 0 }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenChangeRef = useRef(onTokenChange);

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    let active = true;
    void loadTurnstile()
      .then((turnstile) => {
        if (!active || !containerRef.current) return;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          callback: (token: string) => onTokenChangeRef.current(token),
          'expired-callback': () => onTokenChangeRef.current(''),
          'error-callback': () => onTokenChangeRef.current(''),
        });
      })
      .catch(() => {
        if (active) onTokenChangeRef.current('');
      });

    return () => {
      active = false;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, action]);

  useEffect(() => {
    if (resetSignal > 0 && widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onTokenChangeRef.current('');
    }
  }, [resetSignal]);

  return <div ref={containerRef} aria-label="CAPTCHA verification" />;
}

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (turnstileLoader) return turnstileLoader;

  turnstileLoader = new Promise<TurnstileApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-pumpkin-turnstile]');
    const script = existing ?? document.createElement('script');

    const finish = () => window.turnstile
      ? resolve(window.turnstile)
      : reject(new Error('Turnstile failed to load.'));

    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', () => reject(new Error('Turnstile failed to load.')), { once: true });

    if (!existing) {
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.pumpkinTurnstile = 'true';
      document.head.appendChild(script);
    }
  });

  return turnstileLoader;
}
