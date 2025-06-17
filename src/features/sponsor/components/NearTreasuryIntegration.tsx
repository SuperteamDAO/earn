import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, TriangleAlert } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { type SponsorType } from '@/interface/sponsor';

import { SocialInput } from '@/features/social/components/SocialInput';
import { isNearnIoRequestorQuery } from '@/features/sponsor-dashboard/queries/isNearnIoRequestor';

import {
  nearTreasuryFormSchema,
  type NearTreasuryFormValues,
} from '../utils/integrationsFormSchema';

interface Props {
  sponsorData: SponsorType;
  refetchUser: () => void;
  refetch: () => void;
}

function NearTreasuryForm({
  form,
  onSubmit,
  isLoading,
}: {
  form: UseFormReturn<NearTreasuryFormValues>;
  onSubmit: (data: NearTreasuryFormValues) => void;
  isLoading: boolean;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <Image
              src="/assets/NEARTreasuryLogo.svg"
              alt="NEAR Treasury"
              width={40}
              height={40}
            />
            <div className="flex flex-col">
              <h3 className="text-lg text-gray-700">
                Connect to NEAR Treasury
              </h3>
              <p className="text-sm text-gray-600">
                Link your NEAR Treasury to NEARN to create on-chain payment
                proposals directly from approved submissions and automatically
                track their status.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-yellow-50 p-3 text-yellow-800">
            <TriangleAlert className="h-full w-5" />
            <p className="h-full w-full text-sm">
              Before proceeding, please ensure you&apos;ve
              added nearn-io.near to your member list on NEAR Treasury with
              Create Proposal permission only. This must be approved before you
              can link it here. Learn more
            </p>
          </div>

          <SocialInput
            required
            name="nearTreasuryFrontend"
            socialName="website"
            placeholder="your-treasury.near.page"
            formLabel="NEAR Treasury URL"
            control={form.control}
            withIcon={false}
          />
        </div>

        <div className="mt-8">
          <Button
            className="w-full"
            disabled={isLoading}
            size="lg"
            variant="default"
            onClick={() => {
              form.handleSubmit(onSubmit)();
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function NearTreasuryIntegration({
  sponsorData,
  refetchUser,
  refetch,
}: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [disconnectModalOpen, setDisconnectModalOpen] =
    useState<boolean>(false);
  const form = useForm<NearTreasuryFormValues>({
    resolver: zodResolver(nearTreasuryFormSchema),
    mode: 'onBlur',
    defaultValues: {
      nearTreasuryFrontend: '',
    },
  });

  const { data: isRequestor, isLoading: isRequestorLoading } = useQuery(
    isNearnIoRequestorQuery(sponsorData?.nearTreasury?.dao),
  );

  useEffect(() => {
    if (sponsorData) {
      form.reset({
        nearTreasuryFrontend: sponsorData.nearTreasury?.frontend || '',
      });
    }
  }, [sponsorData, form.reset]);

  const onSubmit = async (data: NearTreasuryFormValues) => {
    try {
      setIsLoading(true);
      await axios.post('/api/sponsors/connect-near-treasury', {
        nearTreasuryFrontend:
          data.nearTreasuryFrontend === '' ? null : data.nearTreasuryFrontend,
      });
      await refetchUser();
      await refetch();
      toast.success('Integrations updated successfully!');
    } catch (error) {
      console.error('Error updating integrations:', error);
      toast.error('Failed to update integrations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showForm =
    !sponsorData.nearTreasury?.frontend ||
    sponsorData.nearTreasury?.frontend === '';

  return showForm ? (
    <NearTreasuryForm form={form} onSubmit={onSubmit} isLoading={isLoading} />
  ) : (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/NEARTreasuryLogo.svg"
            alt="NEAR Treasury"
            className="my-auto"
            width={40}
            height={40}
          />
          <div className="flex flex-col gap-1">
            <h3 className="text-lg text-gray-700">NEAR Treasury</h3>
            <p className="text-sm text-gray-600">
              Connected with{' '}
              <Link
                href={`https://${sponsorData.nearTreasury?.frontend}`}
                className="underline"
                target="_blank"
              >
                {sponsorData.nearTreasury?.dao}
              </Link>
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="text-slate-500"
          onClick={() => {
            setDisconnectModalOpen(true);
          }}
        >
          Disconnect
        </Button>
      </div>
      {!isRequestor && !isRequestorLoading && (
        <div className="mt-4 flex items-center gap-3 bg-red-50 p-3 text-red-500">
          <TriangleAlert className="h-full w-5" />
          <p className="h-full w-full text-sm">
            NEARN no longer has permission to submit proposals to your NEAR
            Treasury. Please check your DAO settings to ensure nearn-io.near has
            create proposal permission
          </p>
        </div>
      )}
      <Dialog
        open={disconnectModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDisconnectModalOpen(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Disconnect NEAR Treasury?
            </DialogTitle>
            <DialogDescription>
              After disconnecting, you won’t be able to quickly create payment
              requests without taking additional steps.
              <br />
              However, you can reconnect NEAR Treasury at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex w-full justify-between">
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => {
                setDisconnectModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              className="w-full"
              onClick={() => {
                onSubmit({
                  nearTreasuryFrontend: '',
                  nearTreasuryDao: null,
                });
                setDisconnectModalOpen(false);
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                'Disconnect'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
