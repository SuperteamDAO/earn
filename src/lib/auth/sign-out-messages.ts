// Signing out from a public page: it asks /earn/signin, in a hidden frame, to end
// the session with Privy's SDK (see src/lib/auth/sign-out.ts). The frame says it's
// ready, the page asks, the frame answers whether it worked.
export const SIGN_OUT_READY = 'earn:sign-out-ready';
export const SIGN_OUT = 'earn:sign-out';
export const SIGNED_OUT = 'earn:signed-out';
