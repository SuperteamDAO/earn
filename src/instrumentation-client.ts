import { posthog, type PostHogInterface } from 'posthog-js';

import { publicEnv } from '@/lib/public-env';

// PostHog, through Earn's own origin (/docs-keep, rewritten in
// next.config.ts) so blockers and the CSP let it through.
if (publicEnv.posthogKey) {
  posthog.init(publicEnv.posthogKey, {
    api_host: `${publicEnv.siteUrl.replace(/\/+$/, '')}/docs-keep`,
    ui_host: publicEnv.posthogHost || 'https://app.posthog.com',
    autocapture: false,
    logs: {
      captureConsoleLogs: true,
    },
    loaded: (instance) => {
      if (process.env.NODE_ENV !== 'production') instance.debug();
      window.posthog = instance;
    },
    defaults: '2025-05-24',
    capture_pageview: 'history_change',
    capture_pageleave: true,
  });
}

declare global {
  interface Window {
    posthog: PostHogInterface;
  }
}
