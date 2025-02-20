import dayjs from 'dayjs';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { skillMap } from '@/constants/skillMap';

import {
  Telegram,
  Twitter,
  Website,
} from '@/features/social/components/SocialIcons';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { type LocalProfile } from '../../queries/local-profiles';

export const UserDrawer = ({
  isOpen,
  onClose,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: LocalProfile;
}) => {
  const parentSkills = user.skills.map((skill: any) => skill.skills);
  const subSkills = user.skills.flatMap((skill: any) => skill.subskills);
  const socialLinks = [
    { Component: Telegram, link: user.telegram },
    { Component: Twitter, link: user.twitter },
    { Component: Website, link: user?.website },
  ];

  const formattedCreatedAt = dayjs(user.createdAt).format('DD MMM YYYY');

  const DBadge = ({ children }: { children: ReactNode }) => {
    return (
      <Badge className="rounded bg-[#EFF1F5] px-3 py-1 text-xs font-medium text-[#64739C]">
        {children}
      </Badge>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        className="w-[60rem] p-6 sm:max-w-[60rem]"
        showCloseIcon={false}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-slate-300 pb-6">
            <div className="flex items-center">
              <EarnAvatar
                className="h-11 w-11"
                id={user?.id}
                avatar={user?.photo}
              />
              <div className="ml-4">
                <div className="flex gap-3">
                  <p className="font-medium">{`${user?.firstName} ${user?.lastName}`}</p>
                </div>
                <p className="-mt-0.5 text-sm text-slate-500">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-10">
              <div className="flex flex-col items-center justify-center self-center text-center">
                <p className="text-base font-medium text-slate-500">
                  {user?.wins}
                </p>
                <p className="text-sm text-slate-500">Wins</p>
              </div>
              <div className="flex flex-col items-center justify-center self-center text-center">
                <p className="text-base font-medium text-slate-500">
                  {user?.totalSubmissions}
                </p>
                <p className="text-sm text-slate-500">Submissions</p>
              </div>
              <div className="flex flex-col items-center justify-center self-center text-center">
                <p className="text-base font-medium text-slate-500">
                  ${user.totalEarnings.toLocaleString('en-us')}
                </p>
                <p className="text-sm text-slate-500">$ Earned</p>
              </div>
              <div className="flex flex-col items-center justify-center self-center text-center">
                <p className="text-base font-medium text-slate-500">
                  #{user?.rank}
                </p>
                <p className="text-sm whitespace-nowrap text-slate-500">
                  # Rank
                </p>
              </div>

              <Link
                href={`/t/${user.username}`}
                className="flex items-center pl-6 text-[0.9rem] font-medium whitespace-nowrap text-slate-500 hover:text-slate-600"
                rel="noopener noreferrer"
                target="_blank"
              >
                View Profile <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>

          <div>
            <p className="mb-2 font-medium text-slate-400">Socials</p>
            <div className="flex gap-2">
              {socialLinks.map(({ Component, link }, index) => (
                <div key={index}>
                  <Component link={link} className="h-5 w-5 text-slate-600" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 font-medium text-slate-400">Bio</p>
            <p className="text-slate-500">{user.bio || '-'}</p>
          </div>

          <div>
            <p className="mb-2 font-medium text-slate-400">Discord Username</p>
            <p className="text-slate-500">{user.discord || '-'}</p>
          </div>

          <div>
            <p className="mb-2 font-medium text-slate-400">Skills</p>
            <div className="flex flex-wrap gap-2">
              {parentSkills.length > 0 ? (
                parentSkills.map((skill: string) => {
                  const skillColor = skillMap.find(
                    (e) => e.mainskill === skill,
                  )?.color;
                  return (
                    <Badge
                      key={skill}
                      className={`rounded px-3 py-1 text-xs font-medium`}
                      style={{
                        color: skillColor,
                        backgroundColor: `${skillColor}1A`,
                      }}
                    >
                      {skill}
                    </Badge>
                  );
                })
              ) : (
                <p className="text-slate-500">-</p>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 font-medium text-slate-400">Sub Skills</p>
            <div className="flex flex-wrap gap-2">
              {subSkills.length > 0 ? (
                subSkills.map((skill: string) => (
                  <DBadge key={skill}>{skill}</DBadge>
                ))
              ) : (
                <p className="text-slate-500">-</p>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 font-medium text-slate-400">Interests</p>
            <div className="flex flex-wrap gap-2">
              <p className="text-slate-500">
                {(() => {
                  const interests = JSON.parse(user?.interests || '[]');
                  return interests.length > 0 ? interests.join(', ') : '-';
                })()}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 font-medium text-slate-400">Communities</p>
            <p className="text-slate-500">
              {(() => {
                const communities = JSON.parse(user?.community || '[]');
                return communities.length > 0 ? communities.join(', ') : '-';
              })()}
            </p>
          </div>
          <div>
            <p className="mb-2 font-medium text-slate-400">
              Profile Creation Date
            </p>
            <p className="text-slate-500">{formattedCreatedAt}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
