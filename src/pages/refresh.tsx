import { getAccessToken } from '@privy-io/react-auth';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Refresh() {
  const router = useRouter();
  const redirectUrl = (router.query.redirect_url as string) || '/';

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      router.replace(token ? redirectUrl : '/signin');
    })();
  }, [router, redirectUrl]);

  return <div style={{ padding: 24 }}>Restoring your session…</div>;
}
