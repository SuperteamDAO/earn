// Messages between Earn's wallet drawer (WalletDrawer.tsx) and the wallet
// page framed inside it (/earn/wallet/?embed=1). Same origin only.

// Their session needs Privy again: the drawer opens the sign-in dialog.
export const WALLET_SIGN_IN = 'earn:wallet-sign-in';
// A withdrawal went through: balances shown outside the frame are stale.
export const WALLET_CHANGED = 'earn:wallet-changed';

// Dispatched on the page's window after WALLET_CHANGED, for the header's
// wallet value to reload.
export const WALLET_CHANGED_EVENT = 'earn:wallet-changed';
