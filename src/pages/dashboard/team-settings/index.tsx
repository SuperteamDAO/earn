import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Copy, Plus, Search, X } from 'lucide-react';
import { type Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ErrorSection } from '@/components/shared/ErrorSection';
import { LoadingSection } from '@/components/shared/LoadingSection';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip } from '@/components/ui/tooltip';
import { useDisclosure } from '@/hooks/use-disclosure';
import type { UserSponsor } from '@/interface/userSponsor';
import { SponsorLayout } from '@/layouts/Sponsor';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { Banner } from '@/features/sponsor-dashboard/components/Banner';
import { InviteMembers } from '@/features/sponsor-dashboard/components/Members/InviteMembers';
import { membersQuery } from '@/features/sponsor-dashboard/queries/members';
import { sponsorStatsQuery } from '@/features/sponsor-dashboard/queries/sponsor-stats';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

const debounce = require('lodash.debounce');

const Index = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useUser();
  const [searchText, setSearchText] = useState('');
  const [skip, setSkip] = useState(0);
  const length = 15;

  const { data: sponsorStats, isLoading: isStatsLoading } = useQuery(
    sponsorStatsQuery(user?.currentSponsorId),
  );

  const queryClient = useQueryClient();

  const debouncedSetSearchText = useRef(debounce(setSearchText, 300)).current;

  const { data: session } = useSession();
  const posthog = usePostHog();

  useEffect(() => {
    posthog.capture('members tab_sponsor');
  }, []);

  const { data: membersData, isLoading: isMembersLoading } = useQuery(
    membersQuery({
      searchText,
      skip,
      length,
      currentSponsorId: user?.currentSponsorId,
    }),
  );

  const totalMembers = membersData?.total || 0;
  const members = membersData?.data || [];

  const isAdminLoggedIn = useMemo(() => {
    if (session?.user?.role === 'GOD') return true;

    const userSponsor = user?.UserSponsors?.find(
      (s) => s.sponsorId === user.currentSponsorId,
    );
    if (
      user === undefined ||
      user?.UserSponsors === undefined ||
      userSponsor === undefined
    ) {
      return false;
    }

    return userSponsor.role === 'ADMIN';
  }, [session, user]);

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      await axios.post('/api/sponsor-dashboard/members/remove', {
        id: userId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['members', user?.currentSponsorId],
      });
      toast.success('Member removed successfully');
    },
    onError: (error) => {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member. Please try again.');
    },
  });

  const onRemoveMember = (userId: string | undefined) => {
    if (userId) {
      removeMemberMutation.mutate(userId);
    }
  };
  return (
    <SponsorLayout>
      {isOpen && <InviteMembers isOpen={isOpen} onClose={onClose} />}
      <Banner stats={sponsorStats} isLoading={isStatsLoading} />
      <div className="mb-4 flex justify-between">
        <div className="flex items-center gap-3">
          <p className="text-lg font-semibold text-slate-800">Team Members</p>
          <div className="h-[60%] border-r border-slate-200" />
          <p className="text-slate-500">
            Manage who gets access to your sponsor profile
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(session?.user?.role === 'GOD' ||
            !!(
              user?.UserSponsors?.length &&
              user?.UserSponsors.find(
                (s) => s.sponsorId === user.currentSponsorId,
              )?.role === 'ADMIN'
            )) && (
            <Button
              className="ph-no-captur h-9 bg-indigo-100 text-brand-purple hover:bg-indigo-100/90"
              onClick={() => {
                posthog.capture('invite member_sponsor');
                onOpen();
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Invite Members
            </Button>
          )}
          <div className="relative w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="placeholder:text-md h-9 border-slate-200 bg-white pl-9 placeholder:font-medium placeholder:text-slate-400 focus-visible:ring-brand-purple"
              onChange={(e) => debouncedSetSearchText(e.target.value)}
              placeholder="Search members..."
              type="text"
            />
          </div>
        </div>
      </div>
      {isMembersLoading && <LoadingSection />}
      {!isMembersLoading && !members?.length && (
        <ErrorSection
          title="No members found!"
          message="Invite members to join your organization!"
        />
      )}
      {!isMembersLoading && !!members?.length && (
        <div className="rounded-md border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="text-slate-100">
                <TableHead className="text-sm font-medium uppercase tracking-tight text-slate-400">
                  Member
                </TableHead>
                <TableHead className="text-sm font-medium uppercase tracking-tight text-slate-400">
                  Role
                </TableHead>
                <TableHead className="text-sm font-medium uppercase tracking-tight text-slate-400">
                  Email
                </TableHead>
                <TableHead className="text-sm" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member: UserSponsor) => {
                return (
                  <TableRow key={member?.userId}>
                    <TableCell>
                      <div className="flex items-center">
                        <EarnAvatar
                          className="h-9 w-9"
                          id={member?.user?.id}
                          avatar={member?.user?.photo}
                        />
                        <div className="ml-2 hidden md:block">
                          <p className="text-sm font-medium text-slate-500">
                            {`${member?.user?.firstName} ${member?.user?.lastName}`}
                          </p>
                          <p className="text-sm text-slate-400">
                            @{member?.user?.username}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span
                          className={cn(
                            'inline-flex rounded px-2 py-1 text-xs font-semibold',
                            member?.role === 'ADMIN'
                              ? 'bg-emerald-100 text-teal-600'
                              : 'bg-purple-100 text-brand-purple',
                          )}
                        >
                          {member?.role}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-slate-600">
                      <div className="flex items-center gap-1">
                        {member?.user?.email}
                        <Tooltip
                          content="Copy Email Address"
                          contentProps={{ side: 'right' }}
                        >
                          <Copy
                            className="h-4 w-4 cursor-pointer"
                            onClick={() =>
                              navigator.clipboard.writeText(
                                member?.user?.email as string,
                              )
                            }
                          />
                        </Tooltip>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RemoveMemberModal
                        member={member}
                        isAdminLoggedIn={isAdminLoggedIn}
                        session={session}
                        onRemoveMember={onRemoveMember}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <div className="mt-6 flex items-center justify-end">
        <p className="mr-4 text-sm text-slate-400">
          <span className="font-bold">{skip + 1}</span> -{' '}
          <span className="font-bold">
            {Math.min(skip + length, totalMembers)}
          </span>{' '}
          of <span className="font-bold">{totalMembers}</span> Members
        </p>
        <div className="flex gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={skip <= 0}
            onClick={() =>
              skip >= length ? setSkip(skip - length) : setSkip(0)
            }
            className="flex items-center"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={
              totalMembers <= skip + length || (skip > 0 && skip % length !== 0)
            }
            onClick={() => skip % length === 0 && setSkip(skip + length)}
            className="flex items-center"
          >
            Next
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </SponsorLayout>
  );
};

const RemoveMemberModal = ({
  member,
  isAdminLoggedIn,
  session,
  onRemoveMember,
}: {
  member: UserSponsor;
  isAdminLoggedIn: boolean;
  session: Session | null;
  onRemoveMember: (userId: string | undefined) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const removeMember = async (userId: string | undefined) => {
    await onRemoveMember(userId);
    setIsOpen(false);
    toast.success('Member removed successfully');
  };

  const isSameUser = useMemo(
    () => member?.user?.email !== session?.user?.email,
    [member, session],
  );

  return (
    <div className="flex items-center justify-end">
      {isAdminLoggedIn && isSameUser && (
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          className="bg-indigo-100 text-brand-purple hover:bg-indigo-100/90"
        >
          Remove
        </Button>
      )}
      <Dialog
        key={member.userId}
        open={isOpen}
        onOpenChange={(open) => setIsOpen(open)}
      >
        <DialogContent className="py-2">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-900">
              Remove Member?
            </DialogTitle>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:opacity-100 disabled:pointer-events-none"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </DialogHeader>

          <div className="py-4">
            <p>
              Are you sure you want to remove{' '}
              <span className="font-semibold">{member.user?.email}</span> from
              accessing your sponsor dashboard? You can invite them back again
              later if needed.
            </p>
          </div>

          <DialogFooter className="mt-2">
            <Button
              className="w-full"
              onClick={() => {
                removeMember(member.userId);
              }}
            >
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
