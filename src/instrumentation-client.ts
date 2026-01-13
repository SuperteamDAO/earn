import posthog from 'posthog-js';

import { getURL } from './utils/validUrl';

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: `${getURL()}docs-keep/`,
  ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
  autocapture: false,
  loaded: (posthog) => {
    if (process.env.NODE_ENV !== 'production') posthog.debug();
    window.posthog = posthog;
  },
  defaults: '2025-05-24',
  capture_pageview: 'history_change',
  capture_pageleave: true,
});

declare global {
  interface Window {
    posthog: typeof posthog;
  }
}
