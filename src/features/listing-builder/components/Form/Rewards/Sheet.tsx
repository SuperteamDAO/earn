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
import { calculateTotalPrizes } from '@/features/listing-builder/utils/rewards';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { useListingForm } from '../../../hooks';
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
        setOpen(e);
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
                  <p className={'text-[0.8rem] font-medium text-destructive'}>
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
        className="flex h-[100vh] flex-col p-0 sm:max-w-xl"
      >
        <SheetHeader className="shrink-0 space-y-6 p-6 pb-0">
          <SheetTitle>Add Rewards</SheetTitle>
          <TokenSelect />
          {type === 'project' && <PaymentType />}
        </SheetHeader>

        <div
          className="flex min-h-0 flex-1 flex-col p-6 pt-4"
          id="main-content"
        >
          <Type />
        </div>

        <div className="shrink-0">
          <Separator className="mb-4" />
          <SheetFooter className="p-6 pt-0">
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
    <p className="ml-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs capitalize text-slate-400">
      {children}
    </p>
  );
}
