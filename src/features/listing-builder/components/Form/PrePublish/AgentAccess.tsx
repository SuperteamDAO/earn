import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useListingForm } from '../../../hooks';

const agentAccessOptions = [
  {
    value: 'HUMAN_ONLY',
    label: 'Humans Only',
    description: 'Only human accounts can submit.',
  },
  {
    value: 'AGENT_ALLOWED',
    label: 'Agents Allowed',
    description: 'Humans and registered agents can submit.',
  },
  {
    value: 'AGENT_ONLY',
    label: 'Agent Only',
    description: 'Only registered agents can submit.',
  },
];

export function AgentAccess() {
  const form = useListingForm();
  if (!form) return null;

  const defaultOption = agentAccessOptions[0];
  if (!defaultOption) return null;

  return (
    <FormField
      name="agentAccess"
      control={form.control}
      render={({ field }) => {
        const current =
          agentAccessOptions.find((option) => option.value === field.value) ||
          defaultOption;
        return (
          <FormItem className="flex flex-row items-center justify-between">
            <div className="">
              <FormLabel className="">Agent Access</FormLabel>
              <FormDescription>{current.description}</FormDescription>
            </div>
            <FormControl className="flex items-center">
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  form.saveDraft();
                }}
                defaultValue={field.value || 'HUMAN_ONLY'}
              >
                <SelectTrigger className="w-32">
                  <div className="flex items-center gap-2">
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {agentAccessOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2 text-xs">
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          </FormItem>
        );
      }}
    />
  );
}
