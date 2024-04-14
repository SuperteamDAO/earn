import { MediaPicker } from 'degen';
import { toast } from 'react-hot-toast';

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
  const handleChange = (file: File) => {
    const MB = 1024 * 1024;
    if (file.size > 5 * MB) {
      toast.error('Image too large. Please upload a file under 5MB.');
    } else {
      if (onChange) {
        onChange(file);
      }
    }
  };
  return (
    <MediaPicker
      accept="image/jpeg, image/png, image/webp"
      defaultValue={defaultValue}
      onChange={handleChange}
      onReset={onReset}
      compact
      label="Choose or drag and drop media"
    />
  );
};
