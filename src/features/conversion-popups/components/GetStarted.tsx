import { Button } from '@/components/ui/button';

import { AuthWrapper } from '@/features/auth/components/AuthWrapper';

export const GetStarted = ({
  setIsLoginOpen,
  showLoginOverlay = false,
}: {
  setIsLoginOpen?: (value: boolean) => void;
  showLoginOverlay?: boolean;
}) => {
  return (
    <AuthWrapper
      hideLoginOverlay={!showLoginOverlay}
      redirectTo="/new/talent?type=popup"
      className="w-full"
      onLoginCloseCallback={() => setIsLoginOpen?.(false)}
      onLoginOpenCallback={() => setIsLoginOpen?.(true)}
    >
      <Button className="w-full focus-visible:ring-0">Get Started</Button>
    </AuthWrapper>
  );
};
