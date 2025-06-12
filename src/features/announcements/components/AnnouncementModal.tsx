import { AnimatePresence, motion } from 'motion/react';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { AnimateChangeInHeight } from '@/components/shared/AnimateChangeInHeight';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/utils/cn';

import type { Announcement } from '../types/announcement';

interface AnnouncementModalProps {
  announcements: Announcement[];
  onClose?: () => void;
}

function MainContent({
  announcements,
  current,
  goTo,
  goNext,
  isTransitioning,
  contentRef,
  buttonRefs,
  handleSetOpen,
  cn,
}: {
  announcements: Announcement[];
  current: number;
  goTo: (idx: number) => void;
  goNext: () => void;
  isTransitioning: boolean;
  contentRef: React.RefObject<HTMLDivElement | null>;
  buttonRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>;
  handleSetOpen: (open: boolean) => void;
  cn: (...args: any[]) => string;
}) {
  const currentAnnouncement = announcements[current];
  return (
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
              className={cn(
                'h-11 justify-start rounded-lg px-4 py-2 text-base font-medium text-slate-800 transition-all focus-visible:ring-0',
                i === current
                  ? 'bg-[linear-gradient(90deg,rgba(95,197,255,0.25)_0.23%,rgba(124,134,255,0.45)_99.65%)] text-slate-700'
                  : 'bg-white',
              )}
              onClick={() => goTo(i)}
              ref={(el) => {
                buttonRefs.current[i] = el;
              }}
              tabIndex={i === current ? 0 : -1}
              aria-current={i === current ? 'true' : undefined}
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

      <div className="flex w-full flex-col justify-between md:w-[55.1%]">
        <AnimateChangeInHeight>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              ref={contentRef}
              key={currentAnnouncement?.id}
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              animate={{
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                transition: {
                  delay: isTransitioning ? 0.25 : 0,
                  duration: 0.3,
                },
              }}
              exit={{
                opacity: 0.3,
                y: -20,
                filter: 'blur(8px)',
                transition: { duration: 0.15 },
              }}
              className="flex w-full flex-col items-center justify-center"
            >
              {currentAnnouncement && <currentAnnouncement.Content />}
            </motion.div>
          </AnimatePresence>
        </AnimateChangeInHeight>

        {/* CTA Button */}
        <div className="mt-4 flex flex-col justify-end gap-2 px-4 pb-4 sm:mt-8">
          {currentAnnouncement &&
            (() => {
              const { cta } = currentAnnouncement;
              const isLast = current === announcements.length - 1;
              const handleClick = () => {
                if (cta.onClick) cta.onClick();
                if (!cta.link && !cta.onClick) {
                  if (isLast) {
                    handleSetOpen(false);
                  } else {
                    goNext();
                  }
                }
              };
              const button = (
                <Button
                  className="w-full rounded-lg font-semibold"
                  variant="default"
                  onClick={handleClick}
                >
                  {cta.label}
                </Button>
              );
              if (cta.link) {
                return (
                  <Link href={cta.link} passHref legacyBehavior>
                    <a
                      style={{ width: '100%' }}
                      target="_blank"
                      onClick={
                        cta.onClick
                          ? (e) => {
                              cta.onClick?.();
                              if (!cta.link && !cta.onClick) {
                                e.preventDefault();
                                handleClick();
                              }
                            }
                          : undefined
                      }
                    >
                      {button}
                    </a>
                  </Link>
                );
              }
              return button;
            })()}
          {current !== announcements.length - 1 && (
            <Button
              className="h-6 text-xs md:hidden"
              variant="ghost"
              onClick={() => goTo(current + 1)}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AnnouncementModal({
  announcements,
  onClose,
}: AnnouncementModalProps) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const goNext = () => {
    if (current < announcements.length - 1) {
      setIsTransitioning(true);
      setCurrent((prev) => prev + 1);
    }
  };

  const goTo = (idx: number) => {
    if (idx !== current) {
      setIsTransitioning(true);
      setCurrent(idx);
    }
  };

  const closedOnce = useRef<boolean>(false);

  useEffect(() => {
    if (announcements.length && !closedOnce.current) {
      setOpen(true);
    }
  }, [closedOnce, announcements.length]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (current < announcements.length - 1) {
          goTo(current + 1);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (current > 0) {
          goTo(current - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, current, announcements.length]);

  useEffect(() => {
    if (open && buttonRefs.current[current]) {
      buttonRefs.current[current]?.focus();
    }
  }, [open, current]);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (!announcements.length) return null;

  function handleSetOpen(open: boolean) {
    if (!open) {
      closedOnce.current = true;
      if (onClose) onClose();
    }
    setOpen(open);
  }

  const imagesToPreload = Array.from(
    new Set(announcements.flatMap((a) => a.imagesToPreload ?? [])),
  );

  return (
    <>
      {open && (
        <Head>
          {imagesToPreload.map((url) => (
            <link key={url} rel="preload" as="image" href={url} />
          ))}
        </Head>
      )}
      {isDesktop ? (
        <Dialog open={open} onOpenChange={handleSetOpen}>
          <DialogContent
            hideCloseIcon
            className="w-full max-w-4xl overflow-hidden border-0 border-none bg-transparent p-0 sm:rounded-xl"
            autoFocus={false}
          >
            <MainContent
              announcements={announcements}
              current={current}
              goTo={goTo}
              goNext={goNext}
              isTransitioning={isTransitioning}
              contentRef={contentRef}
              buttonRefs={buttonRefs}
              handleSetOpen={handleSetOpen}
              cn={cn}
            />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={handleSetOpen}>
          <DrawerContent
            classNames={{
              bar: 'absolute top-0 z-90 left-2/4 -translate-2/4 bg-stone-300',
            }}
          >
            <MainContent
              announcements={announcements}
              current={current}
              goTo={goTo}
              goNext={goNext}
              isTransitioning={isTransitioning}
              contentRef={contentRef}
              buttonRefs={buttonRefs}
              handleSetOpen={handleSetOpen}
              cn={cn}
            />
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
