import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/utils';

interface SelectBoxProps {
  label: string;
  watchValue?: string;
  options: string[];
  id: string;
  placeholder: string;
  register: any;
  required?: boolean;
}

export const SelectBox = ({
  label,
  watchValue,
  options,
  id,
  placeholder,
  register,
  required = false,
}: SelectBoxProps) => {
  return (
    <div className="mb-5 w-full">
      <Label className="text-slate-500">{label}</Label>
      <Select {...register(id, { required })}>
        <SelectTrigger
          className={cn(
            'mt-1.5 border-slate-300',
            'focus:border-purple-600 focus:ring-purple-600',
            watchValue?.length === 0 ? 'text-slate-300' : 'text-slate-900',
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
