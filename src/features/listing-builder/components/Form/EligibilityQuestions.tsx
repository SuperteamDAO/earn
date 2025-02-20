import { useAtomValue } from 'jotai';
import { Baseline, Info, Link2, Plus, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';
import TextareaAutosize from 'react-textarea-autosize';

import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/utils/cn';

import { hackathonAtom, isEditingAtom } from '../../atoms';
import { useListingForm } from '../../hooks';

const questionTypes = [
  { value: 'text', label: 'Text', icon: Baseline },
  { value: 'link', label: 'Link', icon: Link2 },
];

export function EligibilityQuestions() {
  const form = useListingForm();
  const type = useWatch({
    control: form.control,
    name: 'type',
  });
  const hackathon = useAtomValue(hackathonAtom);
  const isEditing = useAtomValue(isEditingAtom);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'eligibility',
  });

  const handleAddQuestion = (focus = true) => {
    append(
      {
        order: fields.length + 1,
        question: '',
        type: 'text',
      },
      {
        shouldFocus: focus,
      },
    );
  };

  const handleRemoveQuestion = (index: number) => {
    remove(index);
    form.saveDraft();
  };

  useEffect(() => {
    if (!isEditing) {
      if (type === 'project') {
        if (fields.length === 0) {
          handleAddQuestion(false);
        }
      } else {
        if (type === 'hackathon' && hackathon?.eligibility) {
          form.setValue('eligibility', hackathon?.eligibility as any);
        } else {
          if (fields.length > 0) {
            form.setValue('eligibility', fields.slice(0, 2));
          } else {
            form.setValue('eligibility', []);
          }
        }
      }
    }
  }, [type, hackathon, isEditing]);

  return (
    <FormField
      control={form.control}
      name={`eligibility`}
      render={() => (
        <FormItem className="gap-2 pt-2">
          <div className="flex items-center gap-2">
            <FormLabel className="font-bold text-slate-400 uppercase">
              Custom Questions
            </FormLabel>
            <Tooltip
              delayDuration={100}
              content={
                <p className="max-w-sm">
                  {type === 'project'
                    ? `Applicant's names, email IDs, Discord / Twitter IDs, and SOL wallet are collected by default. Please use this space to ask about anything else!`
                    : `The main bounty submission link, the submitter's names, email IDs, Discord / Twitter IDs, and SOL wallet are collected by default. Please use this space to ask about anything else!`}
                </p>
              }
            >
              <Info className="h-3 w-3 text-slate-400" />
            </Tooltip>
          </div>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <FormField
                key={field.id}
                control={form.control}
                name={`eligibility.${index}.question`}
                render={() => (
                  <div key={field.id} className="group">
                    <FormItem className="gap-2">
                      <FormLabel isRequired={type === 'project' && index === 0}>
                        Question {index + 1}
                      </FormLabel>
                      <div className="ring-primary flex items-start rounded-md border has-focus:ring-1">
                        <FormField
                          control={form.control}
                          name={`eligibility.${index}.type`}
                          render={({ field }) => (
                            <FormItem className="w-fit">
                              <Select
                                value={field.value}
                                defaultValue="text"
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  if (form.getValues().id) form.saveDraft();
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-fit gap-1 rounded-none border-0 focus:ring-0">
                                    <SelectValue className="w-fit">
                                      {(() => {
                                        const selectedType = questionTypes.find(
                                          (type) => type.value === field.value,
                                        );
                                        if (!selectedType) return 'Type';
                                        const Icon = selectedType.icon;
                                        return (
                                          <Icon className="h-4 w-4 text-slate-500" />
                                        );
                                      })()}
                                    </SelectValue>
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {questionTypes.map((type) => (
                                    <SelectItem
                                      key={type.value}
                                      value={type.value}
                                    >
                                      <div className="flex items-center gap-2 text-slate-500">
                                        <type.icon className="h-4 w-4" />
                                        {type.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`eligibility.${index}.question`}
                          render={({ field }) => (
                            <FormItem className="relative w-full border-l">
                              <FormControl>
                                <TextareaAutosize
                                  value={field.value}
                                  placeholder="Enter your question"
                                  minRows={1}
                                  rows={1}
                                  className="min-h-8 resize-none overflow-hidden border-none py-2 pl-2 text-sm placeholder:text-sm placeholder:text-slate-400 focus:ring-0 focus:outline-hidden focus-visible:ring-0"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    form.saveDraft();
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`eligibility.${index}.order`}
                          render={({ field }) => (
                            <input type="hidden" {...field} value={index + 1} />
                          )}
                        />

                        {(fields.length !== 1 || type !== 'project') && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive hidden group-hover:flex"
                            onClick={() => handleRemoveQuestion(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  </div>
                )}
              />
            ))}

            {type !== 'bounty' || fields.length < 2 ? (
              <div className="flex justify-between">
                <FormMessage />
                <Button
                  type="button"
                  variant={fields.length === 0 ? 'outline' : 'link'}
                  size="sm"
                  className={cn(
                    fields.length > 0 && 'ml-auto flex w-fit px-0',
                    fields.length === 0 && 'mt-2 w-full text-slate-500',
                  )}
                  onClick={() => handleAddQuestion()}
                >
                  <Plus /> <span>Add Question</span>
                </Button>
              </div>
            ) : (
              <FormDescription>
                Max two custom questions allow for bounties
              </FormDescription>
            )}
          </div>
        </FormItem>
      )}
    />
  );
}
