import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Login } from '@/features/auth/components/Login';

export default function SigninPage() {
  const [redirectPath, setRedirectPath] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    toast.error('There was an error. You need to sign in again.');

    const savedPath = window.localStorage.getItem('loginRedirectPath');
    if (!savedPath) return;
    const timer = setTimeout(() => {
      setRedirectPath(savedPath);
      window.localStorage.removeItem('loginRedirectPath');
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return <Login isOpen={true} onClose={() => {}} redirectTo={redirectPath} />;
}
