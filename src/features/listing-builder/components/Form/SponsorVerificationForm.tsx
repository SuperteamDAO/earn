import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { MdPendingActions } from 'react-icons/md';
import { toast } from 'sonner';
import type * as z from 'zod';

import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SideDrawer, SideDrawerContent } from '@/components/ui/side-drawer';
import { useUser } from '@/store/user';

import { SocialInput } from '@/features/social/components/SocialInput';
import { sponsorVerificationSchema } from '@/features/sponsor/utils/sponsorVerificationSchema';

export const SponsorVerificationForm = () => {
  const { refetchUser } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof sponsorVerificationSchema>>({
    resolver: zodResolver(sponsorVerificationSchema),
    defaultValues: {
      superteamLead: '',
      fundingSource: '',
      telegram: '',
      commitToDeadline: undefined,
    },
  });

  const { user } = useUser();

  const hasFilledVerificationInfo = !!user?.currentSponsor?.verificationInfo;

  const onSubmit = async (
    values: z.infer<typeof sponsorVerificationSchema>,
  ) => {
    try {
      setIsSubmitting(true);

      await axios.post('/api/sponsor/verification', values);
      await refetchUser();

      toast.success('Verification information updated successfully');
    } catch (error: any) {
      console.error('Error submitting verification:', error);
      toast.error(
        error.response?.data?.message ||
          'Failed to update verification information',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SideDrawer open={true} onClose={() => null}>
      <SideDrawerContent className="h-svh sm:max-w-lg sm:px-4">
        {!hasFilledVerificationInfo ? (
          <div className="flex h-full flex-col">
            <div className="w-fit rounded-full bg-blue-50 p-6">
              <VerifiedBadge style={{ width: '30px', height: '30px' }} />
            </div>
            <p className="my-6 text-xl font-semibold text-slate-900">
              We’ll need to verify your listing before it can be published
            </p>
            <p className="text-sm text-slate-400">
              It’s important for us to verify new sponsors to keep the platform
              free of any bad actors and maintain trust. Please share the
              following information with us, and we will try to verify your
              listing within 24H.
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Once verified, your listing will be published automatically. If we
              need any additional information, we will get in touch with you via
              email or telegram.
            </p>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="mt-6 space-y-6"
              >
                <FormField
                  control={form.control}
                  name="superteamLead"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-1 text-slate-500" isRequired>
                        Is there a Superteam Lead that can vouch for you?
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Superteam Lead name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fundingSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-1 text-slate-500" isRequired>
                        What is your source of funding?
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter funding source" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <SocialInput
                  name="telegram"
                  socialName={'telegram'}
                  formLabel="What’s your Telegram username?"
                  placeholder="username"
                  required
                  control={form.control}
                  showIcon={false}
                  height="h-9"
                />

                <FormField
                  control={form.control}
                  name="commitToDeadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="mb-1 text-slate-500" isRequired>
                        Do you commit to announcing and rewarding winners within
                        one week, after the deadline is over?
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex w-fit items-start justify-start gap-6"
                        >
                          <FormItem className="flex flex-row items-center gap-2">
                            <FormControl>
                              <RadioGroupItem
                                value="yes"
                                className="border-slate-300"
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Yes</FormLabel>
                          </FormItem>
                          <FormItem className="flex flex-row items-center gap-2">
                            <FormControl>
                              <RadioGroupItem
                                className="border-slate-300"
                                value="no"
                              />
                            </FormControl>
                            <FormLabel className="font-normal">No</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex h-full w-full flex-col justify-end">
                  <Button
                    type="submit"
                    className="mt-auto w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        ) : (
          <div className="flex h-svh flex-col items-center justify-center gap-2 px-4 text-center">
            <div className="mb-4 flex h-fit w-fit rounded-full bg-slate-100 p-5">
              <MdPendingActions className="text-slate-500" size={36} />
            </div>
            <p className="text-lg font-semibold text-slate-900">
              Verification details successfully received
            </p>
            <p className="font-medium text-slate-500">
              We’re currently reviewing your listing! This shouldn’t take long.
              We’ll notify you about your verification status via email.
            </p>
          </div>
        )}
      </SideDrawerContent>
    </SideDrawer>
  );
};
