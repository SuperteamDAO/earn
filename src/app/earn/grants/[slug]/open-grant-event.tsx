'use client';

import { posthog } from 'posthog-js';
import { useEffect } from 'react';

// Earn's `open_grant` event, once per visit to a grant's page.
export function OpenGrantEvent() {
  useEffect(() => {
    posthog.capture('open_grant');
  }, []);
  return null;
}
