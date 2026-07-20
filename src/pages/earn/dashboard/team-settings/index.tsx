import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  MoreHorizontal,
  Plus,
  Search,
} from 'lucide-react';
import posthog from 'posthog-js';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ErrorSection } from '@/components/shared/ErrorSection';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
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
import { MembersTableSkeleton } from '@/features/sponsor-dashboard/components/Members/MembersTableSkeleton';
import { membersQuery } from '@/features/sponsor-dashboard/queries/members';
import { sponsorStatsQuery } from '@/features/sponsor-dashboard/queries/sponsor-stats';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

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

const ROLE_OPTIONS: ReadonlyArray<{
  value: Role;
  label: string;
}> = [
  {
    value: 'MEMBER',
    label: 'Member',
  },
  {
    value: 'ADMIN',
    label: 'Admin',
  },
] as const;

const getRoleLabel = (role: Role) => (role === 'ADMIN' ? 'Admin' : 'Member');

const Index = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const { user } = useUser();
  const [searchText, setSearchText] = useState('');
  const [skip, setSkip] = useState(0);
  const length = 15;

  const { data: sponsorStats, isLoading: isStatsLoading } = useQuery(
    sponsorStatsQuery(user?.currentSponsorId),
  );

  const queryClient = useQueryClient();

  const debouncedSetSearchTextRef = useRef<
    ReturnType<typeof debounce> | undefined
  >(undefined);

  useEffect(() => {
    debouncedSetSearchTextRef.current = debounce(setSearchText, 300);

    return () => {
      debouncedSetSearchTextRef.current?.cancel();
    };
  }, [setSearchText]);

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

  useEffect(() => {
    if (user && !isAdminLoggedIn) {
      void router.replace('/earn/dashboard/listings');
    }
  }, [isAdminLoggedIn, router, user]);

  const invalidateMemberData = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['members', user?.currentSponsorId],
    });
  };

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.post('/api/sponsor-dashboard/members/remove', {
        id: userId,
      });
    },
    onSuccess: async () => {
      await invalidateMemberData();
      toast.success('Member removed successfully');
    },
    onError: (error) => {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member. Please try again.');
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: Role }) => {
      await api.post('/api/sponsor-dashboard/members/update-role', {
        id: userId,
        role,
      });
    },
    onSuccess: async (_data, variables) => {
      await invalidateMemberData();
      toast.success(
        `${getRoleLabel(variables.role)} role updated successfully`,
      );
    },
    onError: (error) => {
      console.error('Error updating member role:', error);
      toast.error('Failed to update role. Please try again.');
    },
  });

  const onRemoveMember = async (userId: string) => {
    await removeMemberMutation.mutateAsync(userId);
  };

  const onChangeMemberRole = async (userId: string, role: Role) => {
    await updateMemberRoleMutation.mutateAsync({ userId, role });
  };

  return (
    <SponsorLayout>
      {isOpen && <InviteMembers isOpen={isOpen} onClose={onClose} />}
      <div className="mb-4">
        <Button
          asChild
          variant="ghost"
          className="h-9 px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <Link href="/earn/dashboard/listings">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>
      <Banner stats={sponsorStats} isLoading={isStatsLoading} />
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-lg font-semibold text-slate-800 lg:text-xl">
            Team Members
          </p>
          <p className="max-w-xl text-sm text-slate-500 sm:text-base">
            Manage who gets access to your sponsor profile
          </p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {isAdminLoggedIn ? (
            <Button
              className="ph-no-capture h-10 w-full rounded-lg border border-indigo-500 bg-indigo-50 text-brand-purple hover:bg-indigo-100 lg:w-auto"
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
                className="ph-no-capture h-10 w-full cursor-not-allowed rounded-lg border border-slate-300 bg-slate-50 text-slate-400 lg:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Invite Members
              </Button>
            </Tooltip>
          )}
          <div className="relative w-full lg:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-10 border-slate-200 bg-white pl-9 placeholder:font-medium placeholder:text-slate-400 focus-visible:ring-brand-purple placeholder:text-md"
              onChange={(e) => {
                debouncedSetSearchTextRef.current?.(e.target.value);
              }}
              placeholder="Search members..."
              type="text"
            />
          </div>
        </div>
      </div>
      {isMembersLoading && <MembersTableSkeleton rows={2} />}
      {!isMembersLoading && !members?.length && (
        <ErrorSection
          title="No members found!"
          message="Invite members to join your organization!"
        />
      )}
      {!isMembersLoading && !!members?.length && (
        <>
          <div className="space-y-3 md:hidden">
            {members.map((member: UserSponsor) => (
              <div
                key={member?.userId}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <EarnAvatar
                      className="h-11 w-11 shrink-0"
                      id={member?.user?.id}
                      avatar={member?.user?.photo}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {`${member?.user?.firstName} ${member?.user?.lastName}`}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        @{member?.user?.username}
                      </p>
                    </div>
                  </div>
                  <MemberActionsMenu
                    member={member}
                    isAdminLoggedIn={isAdminLoggedIn}
                    onRemoveMember={onRemoveMember}
                    onChangeMemberRole={onChangeMemberRole}
                    isRemovingMember={
                      removeMemberMutation.isPending &&
                      removeMemberMutation.variables === member.userId
                    }
                    isUpdatingMemberRole={
                      updateMemberRoleMutation.isPending &&
                      updateMemberRoleMutation.variables?.userId ===
                        member.userId
                    }
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <StatusPill
                    {...roleStyles[member?.role ?? 'MEMBER']}
                    className="w-fit"
                  >
                    {member?.role === 'ADMIN' ? 'Admin' : 'Member'}
                  </StatusPill>
                  <CopyButton
                    text={member?.user?.email || ''}
                    contentProps={{ side: 'right' }}
                  >
                    <div className="flex min-w-0 items-center gap-1 text-sm text-slate-600">
                      <Copy className="h-4 w-4 shrink-0" />
                      <span className="truncate">{member?.user?.email}</span>
                    </div>
                  </CopyButton>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden rounded-md border border-slate-200 bg-white md:block">
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
                      <MemberActionsMenu
                        member={member}
                        isAdminLoggedIn={isAdminLoggedIn}
                        onRemoveMember={onRemoveMember}
                        onChangeMemberRole={onChangeMemberRole}
                        isRemovingMember={
                          removeMemberMutation.isPending &&
                          removeMemberMutation.variables === member.userId
                        }
                        isUpdatingMemberRole={
                          updateMemberRoleMutation.isPending &&
                          updateMemberRoleMutation.variables?.userId ===
                            member.userId
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            </Table>
          </div>
        </>
      )}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <p className="text-sm text-slate-400 sm:mr-4">
          <span className="font-bold">{skip + 1}</span> -{' '}
          <span className="font-bold">
            {Math.min(skip + length, totalMembers)}
          </span>{' '}
          of <span className="font-bold">{totalMembers}</span> Members
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={skip <= 0}
            onClick={() =>
              skip >= length ? setSkip(skip - length) : setSkip(0)
            }
            className="flex flex-1 items-center justify-center sm:flex-none"
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
            className="flex flex-1 items-center justify-center sm:flex-none"
          >
            Next
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </SponsorLayout>
  );
};

const MemberActionsMenu = ({
  member,
  isAdminLoggedIn,
  onRemoveMember,
  onChangeMemberRole,
  isRemovingMember,
  isUpdatingMemberRole,
}: {
  member: UserSponsor;
  isAdminLoggedIn: boolean;
  onRemoveMember: (userId: string) => Promise<void>;
  onChangeMemberRole: (userId: string, role: Role) => Promise<void>;
  isRemovingMember: boolean;
  isUpdatingMemberRole: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const currentRole = member.role ?? 'MEMBER';

  const isCurrentUser = useMemo(
    () => member.userId === user?.id || member.user?.email === user?.email,
    [member.user?.email, member.userId, user?.email, user?.id],
  );

  const canManageMember = isAdminLoggedIn && !isCurrentUser;

  const handleRemoveMember = async () => {
    if (!member.userId) return;

    try {
      await onRemoveMember(member.userId);
      setIsOpen(false);
    } catch {
      return;
    }
  };

  const handleRoleChange = async (role: Role) => {
    if (!member.userId || role === currentRole) return;

    try {
      await onChangeMemberRole(member.userId, role);
      setIsOpen(false);
    } catch {
      return;
    }
  };

  return (
    <div className="flex items-center justify-end">
      {canManageMember && (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label={`Manage ${member.user?.email ?? 'member'}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 border-slate-200">
            <DropdownMenuItem
              disabled={isRemovingMember || isUpdatingMemberRole}
              className="text-red-600 focus:text-red-600"
              onSelect={(event) => {
                event.preventDefault();
                void handleRemoveMember();
              }}
            >
              {isRemovingMember ? 'Removing...' : 'Remove from team'}
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger
                disabled={isUpdatingMemberRole || isRemovingMember}
              >
                Change role
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="w-40 border-slate-200">
                  {ROLE_OPTIONS.map((roleOption) => (
                    <DropdownMenuItem
                      key={roleOption.value}
                      disabled={isUpdatingMemberRole}
                      className="justify-between"
                      onSelect={(event) => {
                        event.preventDefault();
                        void handleRoleChange(roleOption.value);
                      }}
                    >
                      <span>{roleOption.label}</span>
                      {currentRole === roleOption.value && (
                        <Check className="h-4 w-4 text-slate-500" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default Index;
