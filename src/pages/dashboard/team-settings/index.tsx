import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Copy, Plus, Search, X } from 'lucide-react';
import posthog from 'posthog-js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ErrorSection } from '@/components/shared/ErrorSection';
import { LoadingSection } from '@/components/shared/LoadingSection';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-tooltip';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { StatusPill } from '@/components/ui/status-pill';
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
import { api } from '@/lib/api';
import { type Role } from '@/prisma/enums';
import { useUser } from '@/store/user';

import { Banner } from '@/features/sponsor-dashboard/components/Banner';
import { InviteMembers } from '@/features/sponsor-dashboard/components/Members/InviteMembers';
import { membersQuery } from '@/features/sponsor-dashboard/queries/members';
import { sponsorStatsQuery } from '@/features/sponsor-dashboard/queries/sponsor-stats';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

const debounce = require('lodash.debounce');

const roleStyles: Record<
  Role,
  {
    readonly color: string;
    readonly backgroundColor: string;
    readonly borderColor: string;
  }
> = {
  ADMIN: {
    color: 'text-emerald-600',
    backgroundColor: 'bg-emerald-100',
    borderColor: 'border-emerald-300',
  },
  MEMBER: {
    color: 'text-blue-600',
    backgroundColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
  },
} as const;

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
    if (user?.role === 'GOD') return true;

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
  }, [user]);

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.post('/api/sponsor-dashboard/members/remove', {
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
      <div className="mb-4 flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-shrink-0 items-start gap-3 lg:items-center">
          <p className="font-semibold whitespace-nowrap text-slate-800 lg:text-lg">
            Team Members
          </p>
          <p className="text-slate-500">
            Manage who gets access to your sponsor profile
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdminLoggedIn ? (
            <Button
              className="ph-no-capture text-brand-purple h-9 rounded-lg border border-indigo-500 bg-indigo-50 hover:bg-indigo-100"
              onClick={() => {
                posthog.capture('invite member_sponsor');
                onOpen();
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Invite Members
            </Button>
          ) : (
            <Tooltip
              content="Only Admins can invite new members to a sponsor profile. Please ask one of your Admins to invite a new user."
              contentProps={{ side: 'bottom' }}
            >
              <Button
                disabled
                className="ph-no-capture h-9 cursor-not-allowed rounded-lg border border-slate-300 bg-slate-50 text-slate-400"
              >
                <Plus className="mr-2 h-4 w-4" />
                Invite Members
              </Button>
            </Tooltip>
          )}
          <div className="relative w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="placeholder:text-md focus-visible:ring-brand-purple h-9 border-slate-200 bg-white pl-9 placeholder:font-medium placeholder:text-slate-400"
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
                <TableHead className="text-sm font-medium tracking-tight text-slate-400 uppercase">
                  Member
                </TableHead>
                <TableHead className="text-sm font-medium tracking-tight text-slate-400 uppercase">
                  Role
                </TableHead>
                <TableHead className="text-sm font-medium tracking-tight text-slate-400 uppercase">
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
                        <StatusPill
                          {...roleStyles[member?.role ?? 'MEMBER']}
                          className="w-18"
                        >
                          {member?.role === 'ADMIN' ? 'Admin' : 'Member'}
                        </StatusPill>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-slate-600">
                      <CopyButton
                        text={member?.user?.email || ''}
                        contentProps={{ side: 'right' }}
                      >
                        <div className="flex items-center gap-1">
                          {member?.user?.email}
                          <Copy className="h-4 w-4 cursor-pointer" />
                        </div>
                      </CopyButton>
                    </TableCell>
                    <TableCell>
                      <RemoveMemberModal
                        member={member}
                        isAdminLoggedIn={isAdminLoggedIn}
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
  onRemoveMember,
}: {
  member: UserSponsor;
  isAdminLoggedIn: boolean;
  onRemoveMember: (userId: string | undefined) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();

  const removeMember = async (userId: string | undefined) => {
    await onRemoveMember(userId);
    setIsOpen(false);
  };

  const isSameUser = useMemo(
    () => member?.user?.email !== user?.email,
    [member],
  );

  return (
    <div className="flex items-center justify-end">
      {isAdminLoggedIn && isSameUser && (
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          className="ph-no-capture text-brand-purple bg-brand-purple-50 border-brand-purple/50 rounded-lg border px-2 py-0.5 text-[0.65rem] hover:bg-indigo-100"
        >
          Remove
        </Button>
      )}
      <Dialog
        key={member.userId}
        open={isOpen}
        onOpenChange={(open) => setIsOpen(open)}
      >
        <DialogContent className="m-0 p-0" hideCloseIcon>
          <DialogTitle className="text-md -mb-1 px-6 pt-4 font-semibold text-slate-900">
            Remove Member?
          </DialogTitle>
          <Separator />
          <div className="px-6 pb-6 text-[0.95rem]">
            <p className="mb-4 text-slate-500">
              Are you sure you want to remove{' '}
              <span className="font-semibold">{member.user?.email}</span> from
              accessing your sponsor dashboard? You can invite them back again
              later if needed.
            </p>

            <div className="flex gap-3">
              <div className="w-1/2" />
              <Button variant="ghost" onClick={() => setIsOpen(false)}>
                Close
              </Button>
              <Button
                className="flex-1 rounded-lg border border-red-500 bg-red-50 text-red-600 hover:bg-red-100"
                onClick={() => {
                  removeMember(member.userId);
                }}
              >
                <div className="rounded-full bg-red-600 p-0.5">
                  <X className="size-2 text-white" />
                </div>
                Remove Member
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
