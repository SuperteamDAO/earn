import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function TalentButton({
  showMessage,
  isLoading,
  checkTalent,
}: {
  showMessage?: boolean;
  isLoading?: boolean;
  checkTalent: () => void;
}) {
  return (
    <>
      {!!showMessage && (
        <Alert variant="default" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Please log in to continue!</AlertDescription>
        </Alert>
      )}
      <Link href="#" className="block">
        <Button
          className="h-12 w-full rounded bg-brand-purple text-white hover:bg-brand-purple-dark"
          onClick={() => checkTalent()}
          disabled={isLoading}
        >
          {isLoading ? (
            'Redirecting...'
          ) : (
            <>
              Continue as talent <span className="ml-1">-&gt;</span>
            </>
          )}
        </Button>
      </Link>
    </>
  );
}
