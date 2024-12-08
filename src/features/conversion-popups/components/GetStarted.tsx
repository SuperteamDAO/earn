import { Button } from '@/components/ui/button';
import { AuthWrapper } from '@/features/auth';

export const GetStarted = () => {
  return (
    <AuthWrapper redirectTo="/new/talent?type=popup" className="w-full">
      <Button className="w-full">Get Started</Button>
    </AuthWrapper>
  );
};
