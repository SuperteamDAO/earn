import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useMediaQuery } from '@/hooks/use-media-query';
import { BountyIcon } from '@/svg/bounty-icon';
import { ProjectIcon } from '@/svg/project-icon';
import { SponsorshipIcon } from '@/svg/sponsorship-icon';

export const CreateListingModal = ({
  isOpen = false,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const posthog = usePostHog();
  const router = useRouter();

  const handleCreateBounty = () => {
    posthog.capture('create new bounty_sponsor');
    router.push('/dashboard/new?type=bounty');
  };

  const handleCreateProject = () => {
    posthog.capture('create new project_sponsor');
    router.push('/dashboard/new?type=project');
  };

  const handleCreateSponsorship = () => {
    posthog.capture('create new sponsorship_sponsor');
    router.push('/dashboard/new?type=sponsorship');
  };

  const isMD = useMediaQuery('(min-width: 768px)');

  if (!isMD) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        hideCloseIcon
        className="max-w-5xl overflow-hidden rounded-lg bg-white p-0"
      >
        <div className="flex">
          <div className="relative flex-1">
            <div className="relative mb-6 flex items-center justify-center bg-violet-50 px-32 py-12">
              <ExternalImage
                className="h-auto w-full"
                alt="Bounty Illustration"
                src={'/dashboard/bounty_illustration.svg'}
              />
              <div className="absolute right-4 top-4 flex items-center rounded-full bg-white px-3 py-1 text-violet-500">
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
                submission(s) are rewarded. Get multiple options to choose from.
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
              <div className="absolute right-4 top-4 flex items-center rounded-full bg-white px-3 py-1 text-blue-500">
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
              <h3 className="mb-4 text-lg font-semibold">Hire a Freelancer</h3>
              <p className="mb-4 text-slate-500">
                Get applications based on a questionnaire set by you, and select
                one applicant to work with. Give a fixed budget, or ask for
                quotes.
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

          <div className="relative flex-1 border-l border-slate-200">
            <div className="relative mb-6 flex items-center justify-center bg-green-50 px-32 py-12">
              <img
                className="h-auto w-full"
                alt="Sponsorship Illustration"
                src={'/assets/sponsorship-back.svg'}
              />
              <div className="absolute right-4 top-4 flex items-center rounded-full bg-white px-3 py-1 text-green-600">
                <SponsorshipIcon
                  styles={{
                    width: '1rem',
                    height: '1rem',
                    marginRight: '0.25rem',
                  }}
                  className="fill-green-600"
                />
                <p className="text-sm font-bold">Sponsorship</p>
              </div>
            </div>

            <div className="p-8">
              <h3 className="mb-4 text-lg font-semibold">
                Support Contributors
              </h3>
              <p className="mb-4 text-slate-500">
                Fund and reward contributions by sponsoring individuals. Share a
                link to receive expenses or payment requests.
              </p>
              <Button
                className="w-full py-6"
                onClick={handleCreateSponsorship}
                size="lg"
              >
                Create a Sponsorship
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
