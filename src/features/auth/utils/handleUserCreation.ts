import { api } from '@/lib/api';

export async function handleUserCreation(email: string) {
  await api.post('/api/user/create', { email });
  window.location.href = '/new?onboarding=true&loginState=signedIn';
}
