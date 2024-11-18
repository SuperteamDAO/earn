import { AlertTriangle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function SponsorButton({
  showMessage,
  isLoading,
  checkSponsor,
}: {
  showMessage?: boolean;
  isLoading?: boolean;
  checkSponsor: () => void;
}) {
  return (
    <>
      {!!showMessage && (
        <Alert variant="default" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Please log in to continue!</AlertDescription>
        </Alert>
      )}
      <Button
        className="h-12 w-full rounded bg-slate-900 text-white hover:bg-slate-700"
        onClick={() => checkSponsor()}
        disabled={isLoading}
      >
        {isLoading ? (
          'Redirecting...'
        ) : (
          <>
            Continue as a sponsor <span className="ml-1">-&gt;</span>
          </>
        )}
      </Button>
    </>
  );
}
