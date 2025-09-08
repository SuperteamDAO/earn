import { Cross2Icon } from '@radix-ui/react-icons';
import { motion } from 'motion/react';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import React, { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMediaQuery } from '@/hooks/use-media-query';
import { type HackathonModel } from '@/prisma/models/Hackathon';
import { BountyIcon } from '@/svg/bounty-icon';
import { ProjectIcon } from '@/svg/project-icon';

export const CreateListingModal = ({
  isOpen = false,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
  hackathons?: HackathonModel[];
}) => {
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      router.prefetch('/dashboard/new');
    }
  }, [isOpen, router]);

  const handleCreateBounty = () => {
    posthog.capture('create new bounty_sponsor');
    router.push('/dashboard/new?type=bounty');
  };

  const handleCreateProject = () => {
    posthog.capture('create new project_sponsor');
    router.push('/dashboard/new?type=project');
  };

  // const handleCreateHackathon = (hackathon: string) => {
  //   posthog.capture('create new hackathon_sponsor');
  //   router.push(`/dashboard/new?type=hackathon&hackathon=${hackathon}`);
  // };

  const isMD = useMediaQuery('(min-width: 768px)');

  if (!isMD) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        hideCloseIcon
        className="overflow-hidden rounded-lg bg-white p-0 sm:max-w-160"
      >
        <ScrollArea
          className="max-h-[100svh]"
          viewportProps={{
            className: 'h-full *:h-full',
          }}
        >
          <motion.div
            initial={{
              opacity: 0,
              transform: 'translateY(-30px)',
              filter: 'blur(4px)',
            }}
            animate={{
              opacity: 1,
              transform: 'translateY(0)',
              filter: 'blur(0px)',
            }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          >
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Select type of listing</h2>
                <DialogClose asChild>
                  <Button variant="ghost" size="icon">
                    <Cross2Icon className="h-4 w-4 text-slate-400" />
                  </Button>
                </DialogClose>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  className="flex h-55 flex-col gap-4 whitespace-normal text-slate-500 hover:text-slate-500"
                  variant="outline"
                  onClick={handleCreateBounty}
                >
                  <BountyIcon
                    className="fill-slate-500"
                    styles={{
                      width: '3rem',
                      height: '3rem',
                    }}
                  />
                  <span className="flex max-w-3/4 flex-col gap-1">
                    <h3 className="text-base font-medium text-slate-900">
                      Bounty
                    </h3>
                    <p className="text-sm font-normal">
                      Get multiple submissions for your task, and reward the
                      best work
                    </p>
                  </span>
                </Button>
                <Button
                  className="flex h-55 flex-col gap-4 whitespace-normal text-slate-500 hover:text-slate-500"
                  variant="outline"
                  onClick={handleCreateProject}
                >
                  <ProjectIcon
                    className="fill-slate-500"
                    styles={{
                      width: '3rem',
                      height: '3rem',
                    }}
                  />
                  <span className="flex max-w-3/4 flex-col gap-1">
                    <h3 className="text-base font-medium text-slate-900">
                      Project
                    </h3>
                    <p className="text-sm font-normal">
                      Receive proposals for your work and pick the right
                      candidate
                    </p>
                  </span>
                </Button>
              </div>
            </div>
          </motion.div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
