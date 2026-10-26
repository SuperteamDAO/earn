'use client';

import { Button } from '@/components/ui/button';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';

// Signed out, a tap goes to sign-in (its own page) and on to the talent
// onboarding.
export const GetStarted = () => {
  return (
    <AuthWrapper redirectTo="/earn/new/talent?type=popup" className="w-full">
      <Button className="w-full focus-visible:ring-0">Get Started</Button>
    </AuthWrapper>
  );
};
