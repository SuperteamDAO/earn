import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { Coins, Gift, RefreshCw } from 'lucide-react';
import { useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

import { isGodAtom, isSTAtom } from '../../../atoms';
import { useListingForm } from '../../../hooks';
import { inKindRewardsQuery } from '../../../queries/in-kind-rewards';

export function RewardTypeControl() {
  const form = useListingForm();
  const isGod = useAtomValue(isGodAtom);
  const isST = useAtomValue(isSTAtom);

  if (!isGod) return null;

  return (
    <FormField
      control={form.control}
      name="rewardType"
      render={({ field }) => (
        <FormItem className="gap-2">
          <FormLabel>Reward Type</FormLabel>
          <FormControl>
            <RadioGroup
              value={field.value}
              onValueChange={(value: 'TOKEN' | 'IN_KIND') => {
                field.onChange(value);
                form.setValue('compensationType', 'fixed');
                form.setValue('minRewardAsk', null);
                form.setValue('maxRewardAsk', null);

                if (value === 'IN_KIND') {
                  form.setValue('token', null);
                  form.setValue('inKindRewardId', null);
                } else {
                  form.setValue('token', isST ? 'USDG' : 'USDC');
                  form.setValue('inKindRewardId', null);
                }

                form.clearErrors(['rewardType', 'token', 'inKindRewardId']);
                form.saveDraft();
              }}
              className="grid grid-cols-2 gap-2"
            >
              <RewardTypeOption
                value="TOKEN"
                title="Token Reward"
                description="Pay winners with a token"
                icon={Coins}
                selected={field.value === 'TOKEN'}
              />
              <RewardTypeOption
                value="IN_KIND"
                title="In-Kind Reward"
                description="Deliver a non-cash reward"
                icon={Gift}
                selected={field.value === 'IN_KIND'}
              />
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function RewardTypeOption({
  value,
  title,
  description,
  icon: Icon,
  selected,
}: {
  value: 'TOKEN' | 'IN_KIND';
  title: string;
  description: string;
  icon: typeof Coins;
  selected: boolean;
}) {
  return (
    <label
      className={cn(
        'focus-within:ring-ring flex min-h-20 cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors focus-within:ring-2',
        selected
          ? 'border-brand-purple bg-brand-purple/5'
          : 'border-slate-200 hover:bg-slate-50',
      )}
    >
      <RadioGroupItem value={value} className="mt-0.5 shrink-0" />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
          <Icon className="size-4 text-slate-500" aria-hidden="true" />
          {title}
        </span>
        <span className="mt-1 block text-xs leading-4 text-slate-500">
          {description}
        </span>
      </span>
    </label>
  );
}

export function InKindRewardSelect() {
  const form = useListingForm();
  const isGod = useAtomValue(isGodAtom);
  const rewardType = useWatch({
    control: form.control,
    name: 'rewardType',
  });
  const query = useQuery(inKindRewardsQuery(rewardType === 'IN_KIND' && isGod));

  if (rewardType !== 'IN_KIND') return null;

  if (!isGod) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-medium text-slate-700">In-Kind Reward</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          This reward is managed by a GOD user.
        </p>
      </div>
    );
  }

  if (query.isLoading) {
    return (
      <div className="space-y-2" aria-label="Loading in-kind rewards">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="border-destructive/20 bg-destructive/5 flex items-center justify-between gap-3 rounded-lg border p-3">
        <p className="text-destructive text-sm">
          Couldn&apos;t load in-kind rewards.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => query.refetch()}
          aria-busy={query.isFetching}
        >
          <RefreshCw
            className={cn('size-4', query.isFetching && 'animate-spin')}
            aria-hidden="true"
          />
          Retry
        </Button>
      </div>
    );
  }

  if (!query.data?.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-medium text-slate-700">
          No active in-kind rewards
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Add an active reward directly in the database before continuing.
        </p>
      </div>
    );
  }

  return (
    <FormField
      control={form.control}
      name="inKindRewardId"
      render={({ field }) => (
        <FormItem className="gap-2">
          <FormLabel isRequired>In-Kind Reward</FormLabel>
          <Select
            value={field.value ?? undefined}
            onValueChange={(value) => {
              field.onChange(value);
              form.saveDraft();
            }}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a reward" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {query.data.map((reward) => (
                <SelectItem key={reward.id} value={reward.id}>
                  <span className="flex items-center gap-2">
                    <img
                      src={reward.icon}
                      alt=""
                      className="size-5 shrink-0 object-contain"
                      aria-hidden="true"
                    />
                    {reward.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function useSelectedInKindReward() {
  const form = useListingForm();
  const isGod = useAtomValue(isGodAtom);
  const rewardType = useWatch({
    control: form.control,
    name: 'rewardType',
  });
  const inKindRewardId = useWatch({
    control: form.control,
    name: 'inKindRewardId',
  });
  const query = useQuery(inKindRewardsQuery(rewardType === 'IN_KIND' && isGod));

  return query.data?.find((reward) => reward.id === inKindRewardId);
}
