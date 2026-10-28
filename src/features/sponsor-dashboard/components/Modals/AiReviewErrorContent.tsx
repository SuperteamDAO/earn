import { XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';

interface AiReviewErrorContentProps {
  subject: 'applications' | 'submissions';
  onRetry: () => void;
}

export const AiReviewErrorContent = ({
  subject,
  onRetry,
}: AiReviewErrorContentProps) => (
  <CardContent className="flex flex-col items-center space-y-8 p-8 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
      <XCircle className="h-8 w-8 stroke-[2.5] text-red-600" />
    </div>

    <div className="space-y-2">
      <h2 className="text-xl font-semibold">Review Failed</h2>
      <p className="mx-auto w-4/5 text-sm text-slate-500">
        {`Something went wrong while reviewing the ${subject}. Please try again.`}
      </p>
    </div>

    <Button
      variant="outline"
      className="w-full border-[#e2e8f0] text-[#62748e]"
      onClick={onRetry}
    >
      Try Again
    </Button>
  </CardContent>
);
