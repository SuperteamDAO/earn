import { useFormContext } from 'react-hook-form';

import { ImagePicker } from '@/components/shared/ImagePicker';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { uploadToCloudinary } from '@/utils/upload';

import { type NewTalentFormData } from '@/features/talent/schema';

interface Props {
  setUploading: (value: boolean) => void;
  setIsGooglePhoto: (value: boolean) => void;
}
export function PhotoField({ setUploading, setIsGooglePhoto }: Props) {
  const form = useFormContext<NewTalentFormData>();
  const { control } = form;
  return (
    <FormField
      name="photo"
      control={control}
      render={({ field }) => (
        <FormItem className="mt-auto w-fit">
          <FormLabel className="sr-only">Profile Picture</FormLabel>
          <FormControl>
            <ImagePicker
              variant="short"
              defaultValue={field.value ? { url: field.value } : undefined}
              onChange={async (e) => {
                setUploading(true);
                const a = await uploadToCloudinary(e, 'earn-pfp');
                setIsGooglePhoto(false);
                field.onChange(a);
                setUploading(false);
              }}
              onReset={() => {
                field.onChange('');
                setUploading(false);
              }}
            />
          </FormControl>
          <FormMessage className="mt-1" />
        </FormItem>
      )}
    />
  );
}
