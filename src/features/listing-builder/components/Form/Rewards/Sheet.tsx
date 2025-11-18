import { ArrowLeftIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useWatch } from 'react-hook-form';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { calculateTotalPrizes } from '@/features/listing-builder/utils/rewards';

import { useListingForm } from '../../../hooks';
import type { BoostStep } from '../Boost/utils';
import { BoostContent } from './BoostContent';
import { Footer } from './Footer';
import { PaymentType } from './PaymentType';
import { TokenLabel } from './Tokens/TokenLabel';
import { TokenSelect } from './Tokens/TokenSelect';
import { Fixed } from './Types/Fixed';
import { Podiums } from './Types/Podiums';
import { Range } from './Types/Range';

export function RewardsSheet() {
  const form = useListingForm();
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<'rewards' | 'boost'>('rewards');
  const [boostStep, setBoostStep] = useState<BoostStep>(0);
  const [isBoostDismissPromptOpen, setIsBoostDismissPromptOpen] =
    useState(false);
  const bypassBoostCloseRef = useRef(false);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isBoostFromUrl = params?.get('boost') === 'true';

  useEffect(() => {
    const shouldOpenBoost = params?.get('boost') === 'true';
    if (shouldOpenBoost) {
      setOpen(true);
      setPanel('boost');
    }
  }, [params]);

  const type = useWatch({
    control: form.control,
    name: 'type',
  });

  const hasRewardsErrors = useMemo(() => {
    const errors = form.formState.errors;
    return (
      (errors.rewards &&
        Object.keys(errors.rewards).some(
          (key) => errors?.rewards?.[key]?.message,
        )) ||
      errors.maxBonusSpots ||
      errors.minRewardAsk ||
      errors.maxRewardAsk
    );
  }, [form]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && panel === 'boost' && !bypassBoostCloseRef.current) {
      setIsBoostDismissPromptOpen(true);
      return;
    }

    setOpen(nextOpen);

    if (nextOpen) {
      bypassBoostCloseRef.current = false;
      setPanel('rewards');
      return;
    }

    setIsBoostDismissPromptOpen(false);
    try {
      const current = new URLSearchParams(params?.toString() || '');
      if (current.has('boost')) {
        current.delete('boost');
        const search = current.toString();
        const base = pathname ?? '/';
        const href = search ? `${base}?${search}` : base;
        router.replace(href);
      }
    } catch (err) {
      /* noop */
    } finally {
      bypassBoostCloseRef.current = false;
    }
  };

  const changeOpen = (
    nextOpen: boolean,
    options?: { bypassPrompt?: boolean },
  ): void => {
    if (!nextOpen && options?.bypassPrompt) {
      bypassBoostCloseRef.current = true;
    }
    if (nextOpen) {
      bypassBoostCloseRef.current = false;
    }
    handleOpenChange(nextOpen);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger className="w-full">
          <FormField
            control={form.control}
            name="rewards"
            render={({}) => {
              return (
                <FormItem className="group items-start gap-1.5">
                  <FormLabel isRequired className="">
                    Rewards
                  </FormLabel>
                  <div className="flex w-full items-center rounded-md border border-slate-200 bg-slate-50 py-0.5 pl-3">
                    <RewardsLabel />
                    <Button
                      variant="link"
                      size="sm"
                      className="ml-auto group-hover:underline"
                    >
                      Edit
                    </Button>
                  </div>
                  {hasRewardsErrors ? (
                    <p className={'text-destructive text-[0.8rem] font-medium'}>
                      Please resolve all errors in rewards
                    </p>
                  ) : (
                    <FormMessage />
                  )}
                </FormItem>
              );
            }}
          />
        </SheetTrigger>
        <SheetContent
          showCloseIcon={false}
          side="right"
          className="flex h-screen flex-col p-0 sm:max-w-xl"
        >
          <SheetHeader className="shrink-0 space-y-6 p-6 pb-0">
            <SheetTitle>
              {panel === 'rewards' ? (
                'Add Rewards'
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="-ml-4 cursor-pointer">
                      <ArrowLeftIcon
                        className="size-4 text-slate-400"
                        onClick={() => setPanel('rewards')}
                      />
                    </div>
                    Boost to reach more people
                  </div>
                  <p className="ml-2.5 text-sm font-normal text-slate-500">
                    Increase your prize pool to unlock promotions across{' '}
                    Twitter, Email, and more.
                  </p>
                </>
              )}
            </SheetTitle>
            {panel === 'rewards' && (
              <>
                <TokenSelect />
                {type === 'project' && <PaymentType />}
              </>
            )}
          </SheetHeader>

          <div
            className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-4 pb-16"
            id="main-content"
          >
            {panel === 'rewards' ? (
              <Type />
            ) : (
              <BoostContent
                boostStep={boostStep}
                setBoostStep={(s: number) => setBoostStep(s as BoostStep)}
              />
            )}
          </div>

          <div className="relative shrink-0 bg-white">
            <Separator className="mb-4" />
            <SheetFooter className="p-6 pt-0">
              <Footer
                panel={panel}
                setPanel={setPanel}
                setOpen={changeOpen}
                boostStep={boostStep}
                isBoostFromUrl={isBoostFromUrl}
              />
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
      <AlertDialog
        open={isBoostDismissPromptOpen}
        onOpenChange={(next) => {
          setIsBoostDismissPromptOpen(next);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Don&rsquo;t want more visibility?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you don&rsquo;t want to boost your listing and get
              more views on it? More visibility means more submissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsBoostDismissPromptOpen(false);
                changeOpen(false, { bypassPrompt: true });
              }}
            >
              Skip Boost
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsBoostDismissPromptOpen(false);
              }}
            >
              Get more visibility
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const Type = memo(() => {
  const form = useListingForm();
  const type = useWatch({
    control: form.control,
    name: 'type',
  });
  const compensationType = useWatch({
    control: form.control,
    name: 'compensationType',
  });
  if (type !== 'project') {
    return <Podiums />;
  } else {
    switch (compensationType) {
      case 'fixed':
        return <Fixed />;
      case 'range':
        return <Range />;
      case 'variable':
        return <></>;
      default:
        return null;
    }
  }
});
Type.displayName = 'CompensationType';

interface RewardsLabelProps {
  hideCompensationType?: boolean;
}
export const RewardsLabel = memo(
  ({ hideCompensationType = false }: RewardsLabelProps) => {
    const form = useListingForm();
    const type = useWatch({
      control: form.control,
      name: 'type',
    });
    const compensationType = useWatch({
      control: form.control,
      name: 'compensationType',
    });
    const rewards = useWatch({
      control: form.control,
      name: 'rewards',
    });
    const maxBonusSpots = useWatch({
      control: form.control,
      name: 'maxBonusSpots',
    });
    const totalReward = useWatch({
      control: form.control,
      name: 'rewardAmount',
    });
    const minRewardAsk = useWatch({
      control: form.control,
      name: 'minRewardAsk',
    });
    const maxRewardAsk = useWatch({
      control: form.control,
      name: 'maxRewardAsk',
    });

    const totalPrizes = useMemo(
      () => calculateTotalPrizes(rewards, maxBonusSpots || 0),
      [rewards, maxBonusSpots],
    );

    if (type !== 'project') {
      return (
        <>
          <TokenLabel
            showIcon
            showSymbol
            amount={totalReward || 0}
            classNames={{
              amount: 'font-medium text-sm',
            }}
            formatter={(n) => formatNumberWithSuffix(n) + '' || '0'}
          />
          {!hideCompensationType && (
            <TypeLabelText>
              | {totalPrizes} {totalPrizes === 1 ? 'Prize' : 'Prizes'}
            </TypeLabelText>
          )}
        </>
      );
    } else {
      if (compensationType === 'fixed') {
        return (
          <>
            <TokenLabel
              showIcon
              showSymbol
              amount={totalReward || 0}
              classNames={{
                amount: 'font-medium text-sm',
              }}
              formatter={(n) => formatNumberWithSuffix(n) + '' || '0'}
            />
            {!hideCompensationType && (
              <TypeLabelText>| Fixed Prize</TypeLabelText>
            )}
          </>
        );
      } else if (compensationType === 'range') {
        return (
          <>
            <TokenLabel
              showIcon
              amount={minRewardAsk || 0}
              classNames={{
                amount: 'font-medium text-sm mr-0',
              }}
              formatter={(n) => formatNumberWithSuffix(n) + '' || '0'}
              className="mr-1"
            />
            <p>-</p>
            <TokenLabel
              showIcon={false}
              showSymbol
              className="ml-1"
              amount={maxRewardAsk || 0}
              classNames={{
                amount: 'font-medium text-sm ml-0',
              }}
              formatter={(n) => formatNumberWithSuffix(n) + '' || '0'}
            />
            {!hideCompensationType && (
              <TypeLabelText>| Range Prize</TypeLabelText>
            )}
          </>
        );
      } else if (compensationType === 'variable') {
        <>
          <TokenLabel showIcon showSymbol />
          {!hideCompensationType && (
            <TypeLabelText>| Variable Prize</TypeLabelText>
          )}
        </>;
      }
    }
    return (
      <>
        <TokenLabel showIcon showSymbol />
        {!hideCompensationType && (
          <TypeLabelText>| Variable Prize</TypeLabelText>
        )}
      </>
    );
  },
);
RewardsLabel.displayName = 'CompensationTypeLabel';

function TypeLabelText({ children }: { children: React.ReactNode }) {
  return (
    <p className="ml-1 overflow-hidden text-xs text-ellipsis whitespace-nowrap text-slate-400 capitalize">
      {children}
    </p>
  );
}
