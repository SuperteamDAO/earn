import { useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useUser } from '@/store/user';

import { useListingForm } from '../../hooks';

export function POC() {
  const form = useListingForm();
  const { user } = useUser();
  const pocSocial = useWatch({
    control: form.control,
    name: 'pocSocials',
  });

  const [wasTouched, setWasTouched] = useState(false);

  useEffect(() => {
    if (user && !pocSocial && !wasTouched) {
      if (user.telegram) {
        form.setValue('pocSocials', user.telegram);
      } else if (user.twitter) {
        form.setValue('pocSocials', user.twitter);
      } else if (user.email) {
        form.setValue('pocSocials', user.email);
      }
    }
  }, [user, pocSocial, wasTouched]);
  return (
    <FormField
      name="pocSocials"
      control={form?.control}
      render={({ field }) => {
        return (
          <FormItem className="gap-2">
            <FormLabel isRequired>Point of Contact (TG / X / Email)</FormLabel>
            <FormControl>
              <Input
                placeholder="yb@superteamearn.com"
                {...field}
                onChange={(e) => {
                  setWasTouched(true);
                  field.onChange(e);
                  form.saveDraft();
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
