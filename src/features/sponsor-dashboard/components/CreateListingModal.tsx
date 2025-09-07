import dayjs from 'dayjs';
import { motion } from 'motion/react';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import React from 'react';

import BsFillLaptopFill from '@/components/icons/BsFillLaptopFill';
import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useMediaQuery } from '@/hooks/use-media-query';
import { type HackathonModel } from '@/prisma/models/Hackathon';
import { BountyIcon } from '@/svg/bounty-icon';
import { ProjectIcon } from '@/svg/project-icon';

export const CreateListingModal = ({
  isOpen = false,
  onClose,
  hackathons,
}: {
  isOpen: boolean;
  onClose: () => void;
  hackathons?: HackathonModel[];
}) => {
  const router = useRouter();

  const handleCreateBounty = () => {
    posthog.capture('create new bounty_sponsor');
    router.push('/dashboard/new?type=bounty');
  };

  const handleCreateProject = () => {
    posthog.capture('create new project_sponsor');
    router.push('/dashboard/new?type=project');
  };

  const handleCreateHackathon = (hackathon: string) => {
    posthog.capture('create new hackathon_sponsor');
    router.push(`/dashboard/new?type=hackathon&hackathon=${hackathon}`);
  };

  const isMD = useMediaQuery('(min-width: 768px)');

  if (!isMD) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        hideCloseIcon
        className="max-w-5xl overflow-hidden rounded-lg bg-white p-0"
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
          <div className="flex">
            <div className="relative flex-1">
              <div className="relative mb-6 flex items-center justify-center bg-violet-50 px-32 py-12">
                <ExternalImage
                  className="h-auto w-full"
                  alt="Bounty Illustration"
                  src={'/dashboard/bounty_illustration.svg'}
                />
                <div className="absolute top-4 right-4 flex items-center rounded-full bg-white px-3 py-1 text-violet-500">
                  <BountyIcon
                    styles={{
                      width: '1rem',
                      height: '1rem',
                      marginRight: '0.25rem',
                      color: 'red',
                      fill: '#8B5CF6',
                    }}
                  />
                  <p className="text-sm font-bold">Bounty</p>
                </div>
              </div>

              <div className="p-8">
                <h3 className="mb-4 text-lg font-semibold">
                  Host a Work Competition
                </h3>
                <p className="mb-4 text-slate-500">
                  All participants complete your scope of work, and the best
                  submission(s) are rewarded. Get multiple options to choose
                  from.
                </p>
                <Button
                  className="w-full py-6"
                  onClick={handleCreateBounty}
                  size="lg"
                >
                  Create a Bounty
                </Button>
              </div>
            </div>

            <div className="relative flex-1 border-l border-slate-200">
              <div className="relative mb-6 flex items-center justify-center bg-blue-50 px-32 py-12">
                <ExternalImage
                  className="h-auto w-full"
                  alt="Project Illustration"
                  src={'/dashboard/project_illustration.svg'}
                />
                <div className="absolute top-4 right-4 flex items-center rounded-full bg-white px-3 py-1 text-blue-500">
                  <ProjectIcon
                    styles={{
                      width: '1rem',
                      height: '1rem',
                      marginRight: '0.25rem',
                      color: 'red',
                      fill: '#3B82F6',
                    }}
                  />
                  <p className="text-sm font-bold">Project</p>
                </div>
              </div>

              <div className="p-8">
                <h3 className="mb-4 text-lg font-semibold">
                  Hire a Freelancer
                </h3>
                <p className="mb-4 text-slate-500">
                  Get applications based on a questionnaire set by you, and
                  select one applicant to work with. Give a fixed budget, or ask
                  for quotes.
                </p>
                <Button
                  className="w-full py-6"
                  onClick={handleCreateProject}
                  size="lg"
                >
                  Create a Project
                </Button>
              </div>
            </div>
          </div>
          {hackathons && (
            <div className="flex border-t border-slate-200 bg-stone-50">
              <div className="relative flex items-center justify-center bg-rose-50 px-16 py-2">
                <ExternalImage
                  className="w-52"
                  alt="Hackathons Illustration"
                  src={'/dashboard/hackathons_illustration.svg'}
                />
                <div className="absolute right-4 bottom-4 flex items-center gap-2 rounded-full bg-white px-3 py-1 text-rose-400">
                  <BsFillLaptopFill className="size-3 fill-rose-400" />
                  <p className="text-xs font-bold">Hackathon</p>
                </div>
              </div>
              <div className="p-8">
                <h3 className="mb-2 text-lg font-semibold">
                  Host a Hackathon Track
                </h3>
                <p className="mb-4 text-slate-500">
                  Add your challenge to an ongoing hackathon. Pick winners and
                  reward the best work. Choose one to get started.
                </p>
                <div className="flex flex-wrap gap-8">
                  {hackathons?.map((hackathon) => (
                    <Button
                      key={hackathon.id}
                      variant="outline"
                      size="sm"
                      className="h-auto border-slate-300 py-2"
                      onClick={() => handleCreateHackathon(hackathon.slug)}
                    >
                      {hackathon.altLogo ? (
                        <img
                          src={hackathon.altLogo}
                          alt={hackathon.name}
                          className="size-8 rounded-sm"
                        />
                      ) : (
                        <BsFillLaptopFill className="size-4 fill-rose-400" />
                      )}
                      <div className="flex flex-col items-start gap-0">
                        <p className="text-sm font-semibold text-slate-700">
                          {hackathon.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Deadline:{' '}
                          {dayjs(hackathon.deadline).format('DD/MM/YYYY')}
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
