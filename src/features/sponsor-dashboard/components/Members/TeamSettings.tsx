'use client';

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
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { posthog } from 'posthog-js';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
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
import { postJson } from '@/lib/fetch-json';
import { useViewer } from '@/lib/viewer';
import type { SponsorStats } from '@/server/sponsor-dashboard';
import type { Member, Role } from '@/server/team-members';

import { Banner } from '@/features/sponsor-dashboard/components/Banner';
import { InviteMembers } from '@/features/sponsor-dashboard/components/Members/InviteMembers';
import { MembersTableSkeleton } from '@/features/sponsor-dashboard/components/Members/MembersTableSkeleton';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

type UserSponsor = Member;

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

// Team Settings: the sponsor's members, a page at a time (`?search=`,
// `?skip=`), loaded on the server.
export const TeamSettings = ({
  stats: sponsorStats,
  members,
  totalMembers,
  skip,
  length,
}: {
  stats: SponsorStats | null;
  members: ReadonlyArray<Member>;
  totalMembers: number;
  skip: number;
  length: number;
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const user = useViewer();
  const router = useRouter();
  const pathname = usePathname() ?? '/earn/dashboard/team-settings/';
  const searchParams = useSearchParams();

  // While the next page loads, the table's skeleton, as Earn showed it.
  const [isMembersLoading, startTransition] = useTransition();
  const setQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    startTransition(() =>
      router.replace(`${pathname}${query ? `?${query}` : ''}`, {
        scroll: false,
      }),
    );
  };
  const setSkip = (value: number) =>
    setQuery({ skip: value > 0 ? String(value) : null });
  const setSearchText = (value: string) =>
    setQuery({ search: value || null, skip: null });

  const debouncedSetSearchTextRef = useRef<
    ReturnType<typeof debounce> | undefined
  >(undefined);

  useEffect(() => {
    debouncedSetSearchTextRef.current = debounce(setSearchText, 300);

    return () => {
      debouncedSetSearchTextRef.current?.cancel();
    };
  });

  useEffect(() => {
    posthog.capture('members tab_sponsor');
  }, []);

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

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const onRemoveMember = async (userId: string) => {
    setRemovingId(userId);
    try {
      await postJson('/api/sponsor-dashboard/members/remove/', { id: userId });
      router.refresh();
      toast.success('Member removed successfully');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member. Please try again.');
      throw error;
    } finally {
      setRemovingId(null);
    }
  };

  const onChangeMemberRole = async (userId: string, role: Role) => {
    setUpdatingId(userId);
    try {
      await postJson('/api/sponsor-dashboard/members/update-role/', {
        id: userId,
        role,
      });
      router.refresh();
      toast.success(`${getRoleLabel(role)} role updated successfully`);
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('Failed to update role. Please try again.');
      throw error;
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      {isOpen && <InviteMembers isOpen={isOpen} onClose={onClose} />}
      <Banner stats={sponsorStats ?? undefined} isLoading={false} />
      <div className="mb-4 flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
        <div className="flex min-w-0 shrink-0 items-start gap-3 lg:items-center">
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
                          avatar={member?.user?.photo ?? undefined}
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
                        isRemovingMember={removingId === member.userId}
                        isUpdatingMemberRole={updatingId === member.userId}
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
    </>
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
  const user = useViewer();
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
              className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
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
