import { api } from '@/lib/api';

const allowedNewUserRedirections = ['/signup', '/new/sponsor'];

export async function handleUserCreation(email: string) {
  await api.post('/api/user/create', { email });
  if (
    allowedNewUserRedirections.some((s) =>
      window.location.pathname.startsWith(s),
    )
  ) {
    const url = new URL(window.location.href);
    url.searchParams.set('loginState', 'signedIn');
    window.location.href = url.toString();
  } else {
    window.location.href = '/new?onboarding=true&loginState=signedIn';
  }
}
