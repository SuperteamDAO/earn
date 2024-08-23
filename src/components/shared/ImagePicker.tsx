import { MediaPicker } from 'degen';
import { toast } from 'sonner';

interface ImagePickerProps {
  defaultValue?:
    | {
        name?: string | undefined;
        type: string;
        url: string;
      }
    | undefined;
  onChange: ((file: File) => void) | undefined;
  onReset?: (() => void) | undefined;
}

export const ImagePicker = ({
  defaultValue,
  onChange,
  onReset,
}: ImagePickerProps) => {
  const onError = (error: string) => {
    toast.error(error);
  };
  return (
    <MediaPicker
      accept="image/jpeg, image/png, image/webp"
      defaultValue={defaultValue}
      onChange={onChange}
      onReset={onReset}
      compact
      label="Choose or drag and drop media"
      onError={onError}
    />
  );
};
