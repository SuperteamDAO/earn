import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function RefreshPage() {
  const router = useRouter();
  const { getAccessToken } = usePrivy();

  useEffect(() => {
    const refreshSession = async () => {
      try {
        const accessToken = await getAccessToken();
        const redirectUri = router.query.redirect_uri as string;

        if (accessToken) {
          // If token is successfully retrieved, redirect to the original destination
          router.replace(redirectUri || '/');
        } else {
          // If no token, the user is not authenticated, redirect to home
          router.replace('/');
        }
      } catch (error) {
        // Handle any errors during token refresh, e.g., redirect to home
        console.error('Failed to refresh session:', error);
        router.replace('/');
      }
    };

    refreshSession();
  }, [getAccessToken, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center"></div>
  );
}
