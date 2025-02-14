import { api } from '@/lib/api';

export async function handleUserCreation(email: string) {
  await api.post('/api/user/create', { email });
  const isSponsor = window.location.pathname.startsWith('/new/sponsor');
  window.location.href = isSponsor
    ? '/new/sponsor?loginState=signedIn'
    : '/new?onboarding=true&loginState=signedIn';
}
