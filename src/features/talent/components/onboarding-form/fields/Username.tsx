import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import { CheckIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

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

export function UsernameField({
  setUsernameValidating,
}: {
  setUsernameValidating: (val: boolean) => void;
}) {
  const form = useFormContext<NewTalentFormData>();
  const {
    control,
    formState: { errors },
    setError,
    clearErrors,
    setValue,
  } = form;

  const { user } = useUser();
  const {
    setUsername,
    isInvalid,
    validationErrorMessage,
    username,
    validating,
  } = useUsernameValidation();
  const [isUsernameTyping, setIsUsernameTyping] = useState(false);
  const [debouncedSetIsUsernameTyping] = useState(() =>
    debounce(setIsUsernameTyping, 500),
  );
  const [debouncedSetUsername] = useState(() => debounce(setUsername, 500));

  const watchedUsername = useWatch({ control, name: 'username' });
  useEffect(() => {
    if (typeof watchedUsername === 'string') {
      setUsername(watchedUsername);
    }
  }, [watchedUsername, setUsername, clearErrors]);

  useEffect(() => {
    if (isUsernameTyping || validating) {
      // react-doctor-disable-next-line react-doctor/no-prop-callback-in-effect -- validating comes from useUsernameValidation inside this field and typing is debounced here; the parent Form needs the combined flag to block submit
      setUsernameValidating(true);
    } else {
      // react-doctor-disable-next-line react-doctor/no-prop-callback-in-effect -- validating comes from useUsernameValidation inside this field and typing is debounced here; the parent Form needs the combined flag to block submit
      setUsernameValidating(false);
    }
  }, [isUsernameTyping, validating, setUsernameValidating]);

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
  }, [
    validationErrorMessage,
    isInvalid,
    username,
    errors.username?.message,
    setError,
    clearErrors,
    debouncedSetIsUsernameTyping,
  ]);

  const { data: randomUsername } = useQuery({
    ...usernameRandomQuery(user?.firstName),
    enabled: !!user && !user.username,
    refetchOnWindowFocus: false,
  });

  // Keyed on this flag rather than the user object so a user refetch cannot
  // overwrite a username the person already typed with the random suggestion.
  const needsRandomUsername = !!user && !user.username;
  useEffect(() => {
    const timer = setTimeout(() => {
      if (needsRandomUsername && randomUsername?.username) {
        setValue('username', randomUsername.username);
        setUsername(randomUsername.username);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [randomUsername, needsRandomUsername, setValue, setUsername]);

  return (
    <FormField
      control={control}
      name={'username'}
      render={({ field }) => (
        <FormItem className={cn('mb-3 flex flex-col gap-1 sm:mb-4 sm:gap-2')}>
          <FormLabel isRequired>Username</FormLabel>
          <FormControl>
            <div className="relative flex">
              <span className="border-input flex items-center rounded-l-md border bg-slate-50 px-2.5 pb-1 text-slate-400 shadow-xs">
                @
              </span>
              <Input
                maxLength={40}
                placeholder="Username"
                className="rounded-l-none border-l-0"
                {...field}
                onChange={(e) => {
                  setIsUsernameTyping(true);
                  const value = e.target.value.replace(/\s+/g, '-');
                  debouncedSetUsername(value);
                  field.onChange(value);
                }}
              />
              {!errors.username?.message &&
                !isUsernameTyping &&
                field.value !== '' && (
                  <span
                    className={cn(
                      'text-background absolute top-2 right-2 flex h-5 w-5 scale-75 items-center rounded-full bg-emerald-500 p-1',
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
