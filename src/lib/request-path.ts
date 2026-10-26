import 'server-only';

import { headers } from 'next/headers';

// The path and query of the page being rendered, as the proxy saw them, for
// sending a signed-out visitor to sign in and back. null outside a request
// the proxy handled.
export async function requestPath(): Promise<string | null> {
  return (await headers()).get('x-earn-path');
}
