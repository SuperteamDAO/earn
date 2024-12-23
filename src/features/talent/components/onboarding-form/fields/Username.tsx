import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import { CheckIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { usernameRandomQuery } from '@/features/talent/queries/random-username';
import { type NewTalentFormData } from '@/features/talent/schema';
import { useUsernameValidation } from '@/features/talent/utils/useUsernameValidation';

export function UsernameField() {
  const form = useFormContext<NewTalentFormData>();
  const {
    control,
    formState: { errors },
    setError,
    clearErrors,
    setValue,
  } = form;

  const { user } = useUser();
  const { setUsername, isInvalid, validationErrorMessage, username } =
    useUsernameValidation();
  const [isUsernameTyping, setIsUsernameTyping] = useState(false);
  const debouncedSetIsUsernameTyping = useRef(
    debounce(setIsUsernameTyping, 500),
  ).current;
  const debouncedSetUsername = useRef(debounce(setUsername, 500)).current;

  useEffect(() => {
    async function validateUsername() {
      if (username === '') {
        setError('username', {
          message: 'Username is required',
        });
        return;
      }
      clearErrors('username');
      if (isInvalid && !!validationErrorMessage && !errors.username?.message) {
        setError('username', {
          message: validationErrorMessage,
        });
      }
      debouncedSetIsUsernameTyping(false);
    }
    validateUsername();
  }, [validationErrorMessage, isInvalid, username, errors.username?.message]);

  const { data: randomUsername } = useQuery({
    ...usernameRandomQuery(user?.firstName),
    enabled: !!user && !user.username,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setTimeout(() => {
      if (user && !user?.username && randomUsername?.username) {
        setValue('username', randomUsername.username);
        setUsername(randomUsername?.username);
      }
    }, 1000);
  }, [randomUsername]);

  return (
    <FormField
      control={control}
      name={'username'}
      render={({ field }) => (
        <FormItem className={cn('mb-5 flex flex-col gap-2')}>
          <FormLabel isRequired>Username</FormLabel>
          <FormControl>
            <div className="relative flex">
              <span className="flex items-center rounded-l-md border border-input bg-slate-50 px-2.5 pb-1 text-slate-400 shadow-sm">
                @
              </span>
              <Input
                maxLength={40}
                placeholder="Username"
                className="rounded-l-none border-l-0"
                {...field}
                onChange={(e) => {
                  setIsUsernameTyping(true);
                  const value = e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, '-');
                  debouncedSetUsername(value);
                  field.onChange(value);
                  // debouncedSetIsUsernameTyping(false)
                }}
              />
              {!errors.username?.message &&
                !isUsernameTyping &&
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
          <FormMessage className="pt-1" />
        </FormItem>
      )}
    />
  );
}
