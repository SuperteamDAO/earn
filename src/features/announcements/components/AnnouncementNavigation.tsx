import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { LocalImage } from '@/components/ui/local-image';
import { cn } from '@/utils/cn';

import type { Announcement } from '../types/announcement';

interface AnnouncementNavigationProps {
  announcements: Announcement[];
  current: number;
  onNavigate: (index: number) => void;
}

export function AnnouncementNavigation({
  announcements,
  current,
  onNavigate,
}: AnnouncementNavigationProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (buttonRefs.current[current]) {
      buttonRefs.current[current]?.focus();
    }
  }, [current]);

  return (
    <div className="relative hidden w-[45%] flex-col border-r bg-white p-5 md:flex">
      <h2 className="mt-4 mb-8 pl-3 text-3xl font-medium">
        {`Here's what we have launched recently`}
      </h2>

      <div className="flex flex-1 flex-col gap-4">
        {announcements.map((announcement, index) => (
          <Button
            autoFocus={false}
            key={announcement.id}
            variant="ghost"
            className={cn(
              'h-11 justify-start rounded-lg px-4 py-2 text-base font-medium text-slate-800 transition-all focus-visible:ring-0',
              index === current
                ? 'bg-[linear-gradient(90deg,rgba(95,197,255,0.25)_0.23%,rgba(124,134,255,0.45)_99.65%)] text-slate-700'
                : 'bg-white',
            )}
            onClick={() => onNavigate(index)}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            tabIndex={index === current ? 0 : -1}
            aria-current={index === current ? 'true' : undefined}
          >
            {announcement.title}
          </Button>
        ))}
      </div>

      <div className="absolute bottom-5 left-8">
        <LocalImage
          className="h-[1.4rem] cursor-pointer object-contain"
          alt="Superteam Earn"
          src="/earn/assets/logo.svg"
        />
      </div>
    </div>
  );
}
