import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Send } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PROJECT_NAME } from '@/constants/project';
import { api } from '@/lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const validateEmail = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    );
};

export function InviteMembers({ isOpen, onClose }: Props) {
  const [email, setEmail] = useState<string>('');
  const [memberType, setMemberType] = useState<string>('MEMBER');

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/member-invites/send/', {
        email,
        memberType,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Invite sent successfully');
    },
    onError: (error) => {
      console.error('Invite error:', error);
      toast.error('Failed to send invite. Please try again.');
    },
  });

  const handleInput = (emailString: string) => {
    const isEmail = validateEmail(emailString);
    if (isEmail) {
      setEmail(emailString);
    } else {
      setEmail('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
        </DialogHeader>

        {inviteMutation.isSuccess ? (
          <>
            <Alert
              variant="default"
              className="flex flex-col items-center justify-center py-5 text-center"
            >
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 className="mb-1 h-5 w-5 text-green-500" />
                <AlertTitle className="text-xl font-bold">
                  Sent Invite!
                </AlertTitle>
              </div>
              <AlertDescription>
                Your team member will receive an email with a link to join
                {PROJECT_NAME}.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button onClick={onClose}>Close</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <FormLabel>Add Email Address</FormLabel>
                <Input
                  className="border-slate-300 text-slate-500 focus-visible:ring-brand-purple"
                  onChange={(e) => handleInput(e.target.value)}
                  type="email"
                  placeholder="Enter email address"
                />
                {inviteMutation.isError && (
                  <p className="mt-1 text-sm text-red-500">
                    Sorry! Error occurred while sending invite.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <FormLabel>Member Type</FormLabel>
                <RadioGroup
                  value={memberType}
                  onValueChange={(value) => setMemberType(value)}
                  className="space-y-2"
                >
                  <Label
                    htmlFor="member"
                    className="flex cursor-pointer items-center space-x-2 rounded-md p-2 hover:bg-slate-100"
                  >
                    <RadioGroupItem
                      value="MEMBER"
                      id="member"
                      className="text-brand-purple"
                    />
                    <div className="ml-2">
                      <p className="text-sm font-bold">Member</p>
                      <p className="text-sm">
                        Members can manage listings, submissions, winner
                        announcements and payments.
                      </p>
                    </div>
                  </Label>

                  <Label
                    htmlFor="admin"
                    className="flex cursor-pointer items-center space-x-2 rounded-md p-2 hover:bg-slate-100"
                  >
                    <RadioGroupItem
                      value="ADMIN"
                      id="admin"
                      className="text-brand-purple"
                    />
                    <div className="ml-2">
                      <p className="text-sm font-bold">Member Admin</p>
                      <p className="text-sm">
                        Admins can add or remove anyone from the team, in
                        addition to having all Member privileges.
                      </p>
                    </div>
                  </Label>
                </RadioGroup>
              </div>
            </div>

            <DialogFooter className="gap-4">
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              <Button
                disabled={!email || inviteMutation.isPending}
                onClick={() => inviteMutation.mutate()}
              >
                {inviteMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner mr-2" />
                    Inviting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Invite
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
