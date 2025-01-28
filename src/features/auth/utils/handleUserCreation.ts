import { type User } from '@privy-io/react-auth';

import { api } from '@/lib/api';

export async function handleUserCreation(user: User) {
  await api.post('/api/user/create', { email: user.email?.address });
  window.location.href = '/new?onboarding=true&loginState=signedIn';
}
