import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Login } from '@/features/auth/components/Login';

export default function SigninPage() {
  const [redirectPath, setRedirectPath] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    const savedPath = window.localStorage.getItem('loginRedirectPath');
    if (savedPath) {
      setRedirectPath(savedPath);
      window.localStorage.removeItem('loginRedirectPath');
    }

    toast.error('There was an error. You need to sign in again.');
  }, []);

  return (
    <div>
      <Login isOpen={true} onClose={() => {}} redirectTo={redirectPath} />
    </div>
  );
}
