import Head from 'next/head';
import { useEffect, useState } from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/use-media-query';

import type { Announcement } from '../types/announcement';
import { AnnouncementContent } from './AnnouncementContent';
import { AnnouncementNavigation } from './AnnouncementNavigation';

interface AnnouncementModalProps {
  announcements: Announcement[];
  onClose?: () => void;
}

function MainContent({
  announcements,
  current,
  onSlideChange,
  isTransitioning,
  handleSetOpen,
  isDesktop,
  isModalOpen,
}: {
  announcements: Announcement[];
  current: number;
  onSlideChange: (index: number) => void;
  isTransitioning: boolean;
  handleSetOpen: (open: boolean) => void;
  isDesktop: boolean;
  isModalOpen: boolean;
}) {
  const goNext = () => {
    if (current < announcements.length - 1) {
      onSlideChange(current + 1);
    }
  };

  const handleClose = () => {
    handleSetOpen(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-lg">
      <AnnouncementNavigation
        announcements={announcements}
        current={current}
        onNavigate={onSlideChange}
      />

      <AnnouncementContent
        announcements={announcements}
        current={current}
        isDesktop={isDesktop}
        isTransitioning={isTransitioning}
        onClose={handleClose}
        onNext={goNext}
        onSlideChange={onSlideChange}
        isModalOpen={isModalOpen}
      />
    </div>
  );
}

export function AnnouncementModal({
  announcements,
  onClose,
}: AnnouncementModalProps) {
  const [open, setOpen] = useState(true);
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSlideChange = (index: number) => {
    if (index !== current) {
      setIsTransitioning(true);
      setCurrent(index);

      const timeoutId = setTimeout(() => {
        setIsTransitioning(false);
      }, 400);
      return () => clearTimeout(timeoutId);
    }
    return;
  };

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (current < announcements.length - 1) {
          handleSlideChange(current + 1);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (current > 0) {
          handleSlideChange(current - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, current, announcements.length]);

  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (!announcements.length) return null;

  function handleSetOpen(open: boolean) {
    if (!open && onClose) {
      onClose();
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
              onSlideChange={handleSlideChange}
              isTransitioning={isTransitioning}
              handleSetOpen={handleSetOpen}
              isDesktop={isDesktop}
              isModalOpen={open}
            />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={handleSetOpen}>
          <DrawerContent
            classNames={{
              bar: 'absolute top-0 z-90 left-2/4 -translate-x-2/4 bg-stone-300',
            }}
          >
            <MainContent
              announcements={announcements}
              current={current}
              onSlideChange={handleSlideChange}
              isTransitioning={isTransitioning}
              handleSetOpen={handleSetOpen}
              isDesktop={isDesktop}
              isModalOpen={open}
            />
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
