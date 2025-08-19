import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Login } from '@/features/auth/components/Login';

export default function SigninPage() {
  const [redirectPath, setRedirectPath] = useState<string | undefined>(
    undefined,
  );
  const router = useRouter();

  useEffect(() => {
    const savedPath = window.localStorage.getItem('loginRedirectPath');
    if (savedPath) {
      setRedirectPath(savedPath);
      window.localStorage.removeItem('loginRedirectPath');
    }

    toast.error('There was an error. You need to sign in again.');
  }, []);

  const handleAuthSuccess = () => {
    // Redirect to home page after successful authentication
    router.push('/');
  };

  return (
    <Login
      isOpen={true}
      onClose={handleAuthSuccess}
      redirectTo={redirectPath}
    />
  );
}
