import { memo, useEffect, useMemo, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { toast } from 'sonner';

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
import { calculateTotalPrizes } from '@/features/listing-builder';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { useListingForm } from '../../../hooks';
import { Footer } from './Footer';
import { PaymentType } from './PaymentType';
import { TokenLabel, TokenSelect } from './Tokens';
import { Fixed, Podiums, Range, Variable } from './Types';

export function RewardsSheet() {
  const form = useListingForm();
  const [open, setOpen] = useState(false);

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

  return (
    <Sheet
      open={open}
      onOpenChange={async (e) => {
        console.log('reward sheet ', e);
        if (!e) {
          if (!(await form.validateRewards()))
            toast.warning('Please Resolve all Errors in Rewards to Continue');
          else setOpen(e);
        }
        if (e && !hasRewardsErrors) setOpen(e);
      }}
    >
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
                  <Label />
                  <Button
                    variant="link"
                    size="sm"
                    className="ml-auto group-hover:underline"
                  >
                    Edit
                  </Button>
                </div>
                {hasRewardsErrors ? (
                  <p className={'text-xs font-medium text-destructive'}>
                    Please Resolve all errors in rewards
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
        side="right"
        className="flex flex-col overflow-hidden sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle>Add Rewards</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-y-4 py-2">
          <TokenSelect />
          {type === 'project' && <PaymentType />}
          <Type />
        </div>
        <div className="mt-auto">
          <Separator className="relative -left-20 my-4 w-[150%]" />
          <SheetFooter>
            <Footer closeSheet={() => setOpen(false)} />
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
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
        return <Variable />;
      default:
        return null;
    }
  }
});
Type.displayName = 'CompensationType';

const Label = memo(() => {
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

  useEffect(() => {
    console.log('compensationType', compensationType);
  }, [compensationType]);

  useEffect(() => {
    console.log('type', type);
  }, [type]);

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
        />
        <TypeLabelText>
          | {totalPrizes} {totalPrizes === 1 ? 'Prize' : 'Prizes'}
        </TypeLabelText>
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
          />
          <TypeLabelText>| Fixed Prize</TypeLabelText>
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
          <TypeLabelText>| Range Prize</TypeLabelText>
        </>
      );
    } else if (compensationType === 'variable') {
      <>
        <TokenLabel showIcon showSymbol />
        <TypeLabelText>| Variable Prize</TypeLabelText>
      </>;
    }
  }
  return (
    <>
      <TokenLabel showIcon showSymbol />
      <TypeLabelText>| Variable Prize</TypeLabelText>
    </>
  );
});
Label.displayName = 'CompensationTypeLabel';

function TypeLabelText({ children }: { children: React.ReactNode }) {
  return (
    <p className="ml-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs capitalize text-slate-400">
      {children}
    </p>
  );
}
