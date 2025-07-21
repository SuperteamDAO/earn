import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { api } from '@/lib/api';
import { dayjs } from '@/utils/dayjs';

import { CreditIcon } from '../icon/credit';

interface CreditEntry {
  id: string;
  type: string;
  createdAt: Date;
  submission: {
    id: string;
    listing: {
      title: string;
      type: string;
      slug: string;
      sponsor?: {
        logo: string;
      };
    };
  };
}

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: CreditEntry | null;
}

const disputeFormSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

type DisputeFormData = z.infer<typeof disputeFormSchema>;

export function DisputeModal({ isOpen, onClose, entry }: DisputeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDesktop = useBreakpoint('md');
  const maxCharacters = 1000;
  const queryClient = useQueryClient();

  const listingType =
    entry?.type === 'SPAM_PENALTY'
      ? entry.submission.listing.type === 'project'
        ? 'PROJECT'
        : 'BOUNTY'
      : 'GRANT';

  const form = useForm<DisputeFormData>({
    resolver: zodResolver(disputeFormSchema),
    defaultValues: {
      description: '',
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = form;
  const description = watch('description');

  useEffect(() => {
    if (!isOpen || !entry) {
      reset();
    }
  }, [isOpen, entry?.id, reset]);

  const handleFormSubmit = async (data: DisputeFormData) => {
    if (!entry) return;

    setIsSubmitting(true);
    try {
      const response = await api.post('/api/spam-dispute', {
        description: data.description,
        listingType,
        submissionId: entry.submission.id,
      });

      if (response.status !== 200) {
        throw new Error('Failed to submit dispute');
      }

      await queryClient.invalidateQueries({
        queryKey: ['creditHistory'],
      });

      reset();
      onClose();
      toast.success('We have received your dispute request.', {
        description: 'Your request will be reviewed by our team.',
        duration: 10000,
        classNames: {
          title: 'text-sm font-semibold',
          description: 'text-xs',
        },
      });
    } catch (error: any) {
      console.error('Error submitting dispute:', error);

      let errorMessage = 'Failed to submit dispute. Please try again.';

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      toast.error(errorMessage, {
        duration: 10000,
        classNames: {
          title: 'text-sm font-semibold',
          description: 'text-xs',
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDeadline = () => {
    if (!entry) return '';

    const createdAt = dayjs(entry.createdAt);
    const deadline = createdAt.add(7, 'days');
    const now = dayjs();
    const timeLeft = deadline.diff(now);

    if (timeLeft <= 0) return 'Expired';

    const duration = dayjs.duration(timeLeft);
    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();

    return `${days}d:${hours}h:${minutes}m`;
  };

  const headerText =
    entry?.type === 'SPAM_PENALTY'
      ? entry.submission.listing.type === 'project'
        ? 'Project Application'
        : 'Bounty Submission'
      : 'Grant Application';

  if (!entry) return null;

  const content = (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="mb-6 flex items-center gap-2">
        <div className="relative">
          <div className="flex size-10 items-center justify-center overflow-hidden rounded-full">
            <img
              src={
                entry.submission.listing.sponsor?.logo ||
                '/android-chrome-512x512.png'
              }
              alt="Sponsor logo"
              className="size-10 rounded-full object-contain"
            />
          </div>
          <div className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-3 border-white bg-white text-gray-700">
            <span className="text-xs">🚫</span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">
            {headerText}
            <span className="ml-2 rounded-full bg-red-50 px-3 py-0.5 text-xs font-medium text-red-400">
              Spam
            </span>
          </h3>
          <p className="line-clamp-1 text-sm text-slate-600">
            {entry.submission.listing.title}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1">
            <p className="text-sm font-semibold text-slate-900">- 1 Credit</p>
            <CreditIcon className="text-brand-purple size-4" />
          </div>
          <p className="text-xxs text-slate-500 sm:text-xs">
            {dayjs(entry.createdAt).format('DD MMM, YYYY')}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Textarea
          {...register('description')}
          placeholder="Describe your experience."
          className="min-h-64 resize-none text-sm placeholder:text-sm sm:min-h-72"
          maxLength={maxCharacters}
        />
        <div className="flex justify-between">
          {errors.description && (
            <span className="text-xs text-red-500">
              {errors.description.message}
            </span>
          )}
          <div className="flex-1" />
          <span className="text-xs text-slate-500">
            {maxCharacters - (description?.length || 0)} characters left
          </span>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="bg-brand-purple hover:bg-brand-purple/90 w-full text-white"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </form>
  );

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="p-0 sm:max-w-xl">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="flex items-center text-left">
              Raise a Dispute against Spam Submission
              <span className="ml-3 rounded bg-slate-100 px-2 py-1 text-xs font-medium tracking-normal text-slate-600">
                {listingType}
              </span>
            </DialogTitle>
            <p className="text-sm text-slate-600">
              Tell us why you think your submission was marked incorrectly
            </p>
          </DialogHeader>
          <Separator className="bg-slate-100" />
          <div className="px-6 pt-1 pb-3">{content}</div>
          <div className="bg-slate-100 p-1.5 text-center text-xs text-slate-500">
            Deadline for raising dispute:{' '}
            <span className="font-semibold">{getDeadline()}</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader>
          <p className="w-fit rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
            {listingType}
          </p>
          <DrawerTitle className="text-md text-left">
            Raise a Dispute against Spam Submission
          </DrawerTitle>
          <p className="text-left text-sm text-slate-600">
            Tell us why you think your submission was marked incorrectly
          </p>
        </DrawerHeader>
        <Separator className="bg-slate-100" />
        <div className="p-4">{content}</div>
        <div className="bg-slate-100 p-1 text-center text-xs text-slate-500">
          Deadline for raising dispute:{' '}
          <span className="font-semibold">{getDeadline()}</span>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
