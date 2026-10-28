import { InfoIcon, Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Tooltip } from '@/components/ui/tooltip';

interface AiReviewInitContentProps {
  unreviewedLabel: string;
  unreviewedCount: number | undefined;
  estimatedTime: string;
  disclaimer: string;
  onProceed: () => void;
}

export const AiReviewInitContent = ({
  unreviewedLabel,
  unreviewedCount,
  estimatedTime,
  disclaimer,
  onProceed,
}: AiReviewInitContentProps) => (
  <>
    <CardContent className="px-6 py-4">
      <div className="space-y-2 font-medium">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-base text-slate-500">
            {unreviewedLabel}
            <Tooltip
              content="We will only review unreviewed submissions. If you've already reviewed some submissions, those will remain untouched."
              contentProps={{
                style: {
                  zIndex: '100',
                },
              }}
            >
              <InfoIcon className="h-4 w-4 text-slate-400" />
            </Tooltip>
          </span>
          <span className="text-xl font-semibold">{unreviewedCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-base text-slate-500">Credits Used</span>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-green-100 px-2 py-0 text-sm text-green-700">
              Free
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-base">Estimated Time</span>
          <span className="text-lg">{estimatedTime}</span>
        </div>
      </div>
    </CardContent>
    <CardFooter className="flex flex-col px-6">
      <Button
        className="ph-no-capture mt-4 w-full"
        size="lg"
        onClick={() => {
          onProceed();
        }}
      >
        <Wand2 className="mr-2 h-5 w-5" />
        Proceed
      </Button>

      <p className="text-muted-foreground mt-2 text-center text-sm">
        {disclaimer}
      </p>
    </CardFooter>
  </>
);
