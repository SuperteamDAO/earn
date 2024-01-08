import { Button } from '@chakra-ui/react';
import { signIn, signOut, useSession } from 'next-auth/react';
import React, { useEffect } from 'react';

export default function Email() {
  const { data: session } = useSession();
  useEffect(() => {
    console.log(session);
  }, [session]);
  if (session) {
    return <Button onClick={() => signOut()}>Sign Out</Button>;
  }
  return <Button onClick={() => signIn('google')}>Sign in</Button>;
}
