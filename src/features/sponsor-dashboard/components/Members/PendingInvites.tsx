import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, Copy, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import React, { useMemo } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip } from '@/components/ui/tooltip';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

interface PendingInviteProps {
  invites: any[] | undefined;
  isLoading: boolean;
}

export function PendingInvites({ invites, isLoading }: PendingInviteProps) {
  const { user } = useUser();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

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

  const removeInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      await api.post('/api/member-invites/remove', {
        inviteId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['invites', user?.currentSponsorId],
      });
      toast.success('Invite cancelled successfully');
    },
    onError: (error) => {
      console.error('Error cancelling invite:', error);
      toast.error('Failed to cancel invite. Please try again.');
    },
  });

  if (isLoading) return <LoadingSection />;

  if (!invites || invites.length === 0) {
    return (
      <ErrorSection
        title="No pending invites"
        message="All invites have been accepted or expired."
      />
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const formatExpiryTime = (date: string) => {
    const expiryDate = new Date(date);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 1
      ? `${diffDays} days`
      : diffDays === 1
        ? '1 day'
        : 'Today';
  };

  return (
    <div className="rounded-md border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="text-slate-100">
            <TableHead className="text-sm font-medium uppercase tracking-tight text-slate-400">
              Invited
            </TableHead>
            <TableHead className="text-sm font-medium uppercase tracking-tight text-slate-400">
              Role
            </TableHead>
            <TableHead className="text-sm font-medium uppercase tracking-tight text-slate-400">
              Invited By
            </TableHead>
            <TableHead className="text-sm font-medium uppercase tracking-tight text-slate-400">
              Date Invited
            </TableHead>
            <TableHead className="text-sm font-medium uppercase tracking-tight text-slate-400">
              Expires In
            </TableHead>
            <TableHead className="text-sm" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {invites.map((invite) => (
            <TableRow key={invite.id}>
              <TableCell className="font-medium text-slate-600">
                {invite.invitedUser ? (
                  <div className="flex items-center">
                    <EarnAvatar
                      className="h-9 w-9"
                      id={invite.invitedUser.id}
                      avatar={invite.invitedUser.photo}
                    />
                    <div className="ml-2 hidden md:block">
                      <p className="text-sm font-medium text-slate-500">
                        {`${invite.invitedUser.firstName || ''} ${invite.invitedUser.lastName || ''}`}
                      </p>
                      <p className="text-sm text-slate-400">
                        {invite.invitedUser.username
                          ? `@${invite.invitedUser.username}`
                          : invite.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    {invite.email}
                    <Tooltip
                      content="Copy Email Address"
                      contentProps={{ side: 'right' }}
                    >
                      <Copy
                        className="ml-1 h-4 w-4 cursor-pointer"
                        onClick={() =>
                          navigator.clipboard.writeText(invite.email)
                        }
                      />
                    </Tooltip>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <span
                    className={
                      invite.memberType === 'ADMIN'
                        ? 'inline-flex rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-teal-600'
                        : 'inline-flex rounded bg-purple-100 px-2 py-1 text-xs font-semibold text-brand-purple'
                    }
                  >
                    {invite.memberType}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <EarnAvatar
                    className="h-9 w-9"
                    id={invite.sender.id}
                    avatar={invite.sender.photo}
                  />
                  <div className="ml-2 hidden md:block">
                    <p className="text-sm font-medium text-slate-500">
                      {`${invite.sender.firstName || ''} ${invite.sender.lastName || ''}`}
                    </p>
                    <p className="text-sm text-slate-400">
                      {invite.sender.username
                        ? `@${invite.sender.username}`
                        : ''}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {formatDate(invite.createdAt)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-slate-400" />
                  {formatExpiryTime(invite.expires)}
                </div>
              </TableCell>
              <TableCell>
                {isAdminLoggedIn && (
                  <CancelInviteDialog
                    invite={invite}
                    removeInviteMutation={removeInviteMutation}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface CancelInviteDialogProps {
  invite: any;
  removeInviteMutation: any;
}

function CancelInviteDialog({
  invite,
  removeInviteMutation,
}: CancelInviteDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleCancel = async () => {
    await removeInviteMutation.mutate(invite.id);
    setIsOpen(false);
  };

  return (
    <div className="flex items-center justify-end">
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-red-500 hover:bg-red-100 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="py-5">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-900">
              Cancel Invite?
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p>
              Are you sure you want to cancel the invitation sent to{' '}
              <span className="font-semibold">
                {invite.invitedUser
                  ? `${invite.invitedUser.firstName || ''} ${invite.invitedUser.lastName || ''}`
                  : invite.email}
              </span>
              ?
            </p>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Keep Invite
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={removeInviteMutation.isPending}
            >
              {removeInviteMutation.isPending
                ? 'Cancelling...'
                : 'Cancel Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
