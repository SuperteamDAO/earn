import { useAtom } from 'jotai';
import { ExternalLink, Info, Loader2 } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import React, { useMemo, useState } from 'react';
import { useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { previewAtom } from '../../atoms';
import { useListingForm } from '../../hooks';

export const PreviewListingModal = () => {
  const [showPreview, setShowPreview] = useAtom(previewAtom);
  const [activeView, setActiveView] = useState('desktop');
  const [isLoading, setIsLoading] = useState(true);
  const posthog = usePostHog();

  const form = useListingForm();
  const type = useWatch({
    control: form.control,
    name: 'type',
  });
  const slug = useWatch({
    control: form.control,
    name: 'slug',
  });
  const previewUrl = useMemo(() => {
    return `/listings/${type}/${slug}?preview=1`;
  }, [type, slug]);

  return (
    <Dialog open={showPreview} onOpenChange={setShowPreview}>
      <DialogContent hideCloseIcon className="h-full max-w-full p-0">
        <DialogHeader className="border-b px-6 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <DialogTitle className="text-lg font-semibold text-slate-500">
              Preview Listing
            </DialogTitle>

            <Tabs
              value={activeView}
              onValueChange={setActiveView}
              className="justify-self-center"
            >
              <TabsList>
                <TabsTrigger value="desktop">Desktop</TabsTrigger>
                <TabsTrigger value="mobile">Mobile</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center justify-end gap-4">
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-300 hover:text-slate-400"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      This link is for preview purposes only and is accessible
                      only to those who have it. It is not your final link for
                      sharing with your community
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button
                  variant="outline"
                  className="ph-no-capture"
                  onClick={() => {
                    posthog.capture('new tab_preview');
                    window.open(previewUrl, '_blank');
                  }}
                >
                  Secret Draft Link
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <Button
                className="ph-no-capture"
                onClick={() => {
                  posthog.capture('continue editing_preview');
                  setShowPreview(false);
                }}
              >
                Continue Editing
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="h-full p-10">
          <div
            className="relative mx-auto h-[900px] w-4/5 overflow-hidden rounded-lg border-2 border-slate-100"
            style={{
              width: activeView === 'mobile' ? '420px' : '100%',
            }}
          >
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            <iframe
              src={`${previewUrl}&nsb=1`}
              className="h-full w-full"
              title="Preview"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
