import { memo, useMemo, useState } from 'react';
import { useWatch } from 'react-hook-form';

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
import { Footer } from './Footer';
import { TokenLabel } from './Tokens/TokenLabel';
import { TokenSelect } from './Tokens/TokenSelect';
import { Podiums } from './Types/Podiums';

export function RewardsSheet() {
  const form = useListingForm();
  const [open, setOpen] = useState(false);

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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="w-full text-left">
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
          <SheetTitle>Add Rewards</SheetTitle>
          <TokenSelect />
        </SheetHeader>

        <div
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-4 pb-16"
          id="main-content"
        >
          <Podiums />
        </div>

        <div className="relative shrink-0 bg-white">
          <Separator className="mb-4" />
          <SheetFooter className="p-6 pt-0">
            <Footer setOpen={setOpen} />
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface RewardsLabelProps {
  hideCompensationType?: boolean;
}
export const RewardsLabel = memo(
  ({ hideCompensationType = false }: RewardsLabelProps) => {
    const form = useListingForm();
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

    const totalPrizes = useMemo(
      () => calculateTotalPrizes(rewards, maxBonusSpots || 0),
      [rewards, maxBonusSpots],
    );

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
