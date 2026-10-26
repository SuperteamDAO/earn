'use client';

import { Check, ExternalLink, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { JTTG } from '@/constants/Telegram';
import { getJson } from '@/lib/fetch-json';

interface ExportSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiEndpoint: string;
  queryParams: Record<string, string | number | boolean | null | undefined>;
  entityName?: string;
}

export const ExportSheetsModal = ({
  isOpen,
  onClose,
  apiEndpoint,
  queryParams,
  entityName = 'data',
}: ExportSheetsModalProps) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [countdown, setCountdown] = useState(15);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const hasTriggeredRef = useRef(false);

  // A newer export (or closing) makes an older one's answer moot.
  const attemptRef = useRef(0);

  const runExport = useCallback(() => {
    const attempt = ++attemptRef.current;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null) params.set(key, String(value));
    }
    getJson<{ url?: string }>(`${apiEndpoint}?${params.toString()}`)
      .then((data) => {
        if (attempt !== attemptRef.current) return;
        const url = data?.url || '';
        if (url) {
          setSheetUrl(url);
          setStatus('success');
        } else {
          setStatus('error');
        }
      })
      .catch((error: unknown) => {
        if (attempt !== attemptRef.current) return;
        console.error('Export error:', error);
        setStatus('error');
      });
  }, [apiEndpoint, queryParams]);

  useEffect(() => {
    if (isOpen && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      // Reset state and trigger mutation when modal opens
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('loading');

      setCountdown(15);

      setSheetUrl(null);
      runExport();
    } else if (!isOpen) {
      hasTriggeredRef.current = false;
    }
  }, [isOpen, runExport]);

  useEffect(() => {
    if (status !== 'loading' || !isOpen) return undefined;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1 && !sheetUrl) {
          return prev + 5;
        }
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, isOpen, sheetUrl]);

  const handleRetry = () => {
    setStatus('loading');
    setCountdown(15);
    setSheetUrl(null);
    runExport();
  };

  const handleClose = () => {
    setStatus('loading');
    setCountdown(15);
    setSheetUrl(null);
    attemptRef.current += 1;
    onClose();
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex h-full flex-col gap-4">
            <div className="flex flex-col py-14">
              <div className="mb-4 flex justify-center">
                <div className="relative flex items-center justify-center">
                  <div
                    className="h-16 w-16 animate-spin rounded-full border-slate-200 border-t-indigo-600"
                    style={{ borderWidth: '4px' }}
                  />
                  <div className="absolute flex items-center justify-center">
                    <p className="font-mono text-xl font-bold text-indigo-600">
                      {countdown}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mx-auto flex max-w-[24rem] flex-col items-center gap-3">
                <p className="text-lg font-semibold text-slate-900">
                  Creating Google Sheet
                </p>
                <p className="text-center text-sm text-slate-500">
                  {`We're exporting your ${entityName} to Google Sheets. This
                  usually takes 10-15 seconds.`}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1" />
              <Button variant="ghost" type="button" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="flex h-full flex-col gap-8">
            <div className="py-10">
              <div className="flex items-center justify-center">
                <div className="flex items-center justify-center rounded-full bg-emerald-50 p-6">
                  <div className="rounded-full bg-emerald-600 p-3">
                    <Check className="h-10 w-10 text-white" strokeWidth={3} />
                  </div>
                </div>
              </div>

              <div className="mx-auto flex max-w-[26rem] flex-col items-center gap-2">
                <p className="mt-6 text-lg font-semibold text-slate-900">
                  Google Sheet Ready!
                </p>
                <p className="text-center text-sm text-slate-500">
                  Your {entityName} have been exported successfully. Click the
                  button below to open the sheet in a new tab.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1" />
              <Button variant="ghost" type="button" onClick={handleClose}>
                Close
              </Button>
              <a
                href={sheetUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full rounded-lg border border-emerald-500 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-600">
                  <ExternalLink className="size-4" />
                  Open Google Sheet
                </Button>
              </a>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex h-full flex-col">
            <div className="py-8">
              <div className="flex items-center justify-center">
                <div className="flex items-center justify-center rounded-full bg-red-50 p-6">
                  <div className="rounded-full bg-red-600 p-3">
                    <X className="h-10 w-10 text-white" strokeWidth={3} />
                  </div>
                </div>
              </div>

              <div className="mx-auto flex max-w-[26rem] flex-col items-center gap-2">
                <p className="mt-8 text-lg font-semibold text-slate-900">
                  Export Failed
                </p>
                <p className="text-center text-sm text-slate-500">
                  {`We couldn't create the Google Sheet. This might be due to a
                  temporary issue. Please try again.`}
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <div className="flex-1" />
              <Button variant="ghost" type="button" onClick={handleClose}>
                Close
              </Button>
              <Button
                className="flex-1 rounded-lg border border-indigo-500 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-600"
                onClick={handleRetry}
              >
                Try Again
              </Button>
            </div>

            <div className="mx-auto mt-2 -mb-2 flex flex-col items-center gap-2">
              <a
                href={JTTG}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center"
              >
                <Button
                  className="bg-none text-sm font-normal text-slate-400"
                  variant="link"
                  type="button"
                >
                  Still having issues?{' '}
                  <span className="text-slate-500 underline">Contact Us</span>
                </Button>
              </a>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose} modal>
      <DialogContent className="m-0 max-w-xl p-0" hideCloseIcon>
        <DialogTitle className="text-md -mb-1 px-6 pt-4 font-semibold text-slate-900">
          Export to Google Sheets
        </DialogTitle>
        <Separator />
        <div className="px-6 pb-6 text-[0.95rem]">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
};
