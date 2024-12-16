import { Button } from '@/components/ui/button';
import { AuthWrapper } from '@/features/auth/components/AuthWrapper';

export const GetStarted = () => {
  return (
    <AuthWrapper
      hideLoginOverlay
      redirectTo="/new/talent?type=popup"
      className="w-full"
    >
      <Button className="w-full focus-visible:ring-0">Get Started</Button>
    </AuthWrapper>
  );
};
