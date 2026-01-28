import { useEffect } from 'react';

export default function AuthErrorPage() {
  useEffect(() => {
    if (window.opener) {
      window.close();
    }
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'sans-serif',
        flexDirection: 'column',
      }}
    >
      <p className="mb-4 text-2xl font-bold">Authentication Canceled</p>
      <p className="text-sm">You have canceled the authentication process.</p>
      <p className="text-sm">You can now close this window.</p>
    </div>
  );
}
