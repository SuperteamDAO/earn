import debounce from 'lodash.debounce';
import { CheckIcon } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';

import { type NewTalentFormData } from '@/features/talent/schema';

export function PublicKeyField() {
  const form = useFormContext<NewTalentFormData>();
  const {
    control,
    formState: { errors },
  } = form;

  const [isPublicKeyTyping, setIsPublicKeyTyping] = useState(false);
  const debouncedSetIsPublicKeyTyping = useRef(
    debounce(setIsPublicKeyTyping, 500),
  ).current;

  return (
    <FormField
      name="publicKey"
      control={control}
      render={({ field }) => (
        <FormItem className="mb-3 sm:mb-4">
          <FormLabel isRequired className="">
            Your Solana Wallet Address
          </FormLabel>
          <FormDescription className="mb-2 mt-0 text-slate-500 sm:mb-4">
            You will receive rewards if you win. Download{' '}
            <Link
              className="underline"
              href="https://backpack.app"
              rel="noopener noreferrer"
              target="_blank"
            >
              Backpack
            </Link>
            {' / '}
            <Link
              className="underline"
              href="https://solflare.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              Solflare
            </Link>{' '}
            if you don&apos;t have a Solana wallet
          </FormDescription>
          <FormControl>
            <div className="relative">
              <Input
                className="pr-8"
                autoComplete="off"
                placeholder="Enter your Solana wallet address"
                {...field}
                onChange={(e) => {
                  setIsPublicKeyTyping(true);
                  debouncedSetIsPublicKeyTyping(false);
                  field.onChange(e);
                }}
              />
              {!errors.publicKey?.message &&
                !isPublicKeyTyping &&
                field.value === '' && (
                  <span
                    className={cn(
                      'absolute right-2 top-2 flex h-5 w-5 scale-75 items-center rounded-full bg-emerald-500 p-1 text-background',
                    )}
                  >
                    <CheckIcon className="h-full w-full stroke-[3px]" />
                  </span>
                )}
            </div>
          </FormControl>
          <FormMessage className="mt-1" />
        </FormItem>
      )}
    />
  );
}
