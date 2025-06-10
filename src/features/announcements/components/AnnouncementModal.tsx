import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';

import type { Announcement } from '../types/announcement';

interface AnnouncementModalProps {
  announcements: Announcement[];
  onClose?: () => void;
}

export function AnnouncementModal({
  announcements,
  onClose,
}: AnnouncementModalProps) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);

  const goNext = () =>
    setCurrent((prev) => Math.min(prev + 1, announcements.length - 1));
  const goBack = () => setCurrent((prev) => Math.max(prev - 1, 0));
  const goTo = (idx: number) => setCurrent(idx);

  const closedOnce = useRef<boolean>(false);
  useEffect(() => {
    if (announcements.length && !closedOnce.current) {
      setOpen(true);
    }
  }, [closedOnce, announcements.length]);

  if (!announcements.length) return null;

  function handleSetOpen(open: boolean) {
    if (!open) {
      closedOnce.current = true;
      if (onClose) onClose();
    }
    setOpen(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleSetOpen}>
      <DialogContent
        hideCloseIcon
        className="w-full max-w-4xl overflow-hidden border-none bg-transparent p-0 sm:rounded-xl"
      >
        <div className="mx-auto flex w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-lg">
          <div className="relative hidden w-[45%] flex-col border-r bg-white p-5 md:flex">
            <h2 className="mt-4 mb-8 pl-3 text-3xl font-medium">
              {`Here's what we have launched recently`}{' '}
            </h2>
            <div className="flex flex-1 flex-col gap-4">
              {announcements.map((a, i) => (
                <Button
                  autoFocus={false}
                  key={a.id}
                  variant="ghost"
                  className={`h-11 justify-start rounded-lg px-4 py-2 text-base font-medium text-slate-800 transition-all ${i === current ? 'bg-[linear-gradient(90deg,rgba(95,197,255,0.25)_0.23%,rgba(124,134,255,0.45)_99.65%)] text-slate-700' : 'bg-white'}`}
                  onClick={() => goTo(i)}
                >
                  {a.title}
                </Button>
              ))}
            </div>
            <div className="absolute bottom-5 left-8">
              <img
                className="h-[1.4rem] cursor-pointer object-contain"
                alt="Superteam Earn"
                src="/assets/logo.svg"
              />
            </div>
          </div>
          <div className="flex w-full flex-col justify-between md:w-[55%]">
            <div className="flex flex-1 flex-col items-center justify-center">
              {announcements.map((a, i) => (
                <div
                  key={a.id}
                  style={{ display: i === current ? 'block' : 'none' }}
                >
                  <a.Content />
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-between gap-3 p-3">
              {current > 0 ? (
                <Button
                  className="w-full rounded-lg font-semibold text-slate-700"
                  onClick={goBack}
                  variant="outline"
                >
                  Back
                </Button>
              ) : (
                <DialogClose asChild>
                  <Button
                    className="w-full rounded-lg font-semibold text-slate-700"
                    onClick={goBack}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </DialogClose>
              )}
              {current === announcements.length - 1 ? (
                <DialogClose asChild>
                  <Button className="w-full rounded-lg font-semibold">
                    Finish
                  </Button>
                </DialogClose>
              ) : (
                <Button
                  className="w-full rounded-lg font-semibold"
                  onClick={goNext}
                  disabled={current === announcements.length - 1}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
