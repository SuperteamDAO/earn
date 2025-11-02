import { Baseline, Link2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import {
  type FieldArrayWithId,
  useFieldArray,
  useWatch,
} from 'react-hook-form';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/utils/cn';

import { useListingForm, type UseListingFormReturn } from '../../../hooks';
import { type ListingFormData } from '../../../types';

const questionTypes = [
  { value: 'text', label: 'Text', icon: Baseline },
  { value: 'link', label: 'Link', icon: Link2 },
];

interface EligibilityQuestionItemProps {
  field: FieldArrayWithId<ListingFormData, 'eligibility', 'id'>;
  index: number;
  form: UseListingFormReturn;
  type: string | undefined;
  handleRemoveQuestion: (index: number) => void;
  fieldsLength: number;
}

function EligibilityQuestionItem({
  field,
  index,
  form,
  type,
  handleRemoveQuestion,
  fieldsLength,
}: EligibilityQuestionItemProps) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <FormField
      key={field.id}
      control={form.control}
      name={`eligibility.${index}.question`}
      render={() => (
        <div key={field.id} className="group">
          <FormItem className="gap-2">
            <div className="flex items-center justify-between">
              <FormLabel
                className="font-medium text-slate-500 sm:text-sm"
                isRequired={type === 'project' && index === 0}
              >
                Question {index + 1}
              </FormLabel>
              {!(type === 'project' && index === 0) && (
                <FormField
                  control={form.control}
                  name={`eligibility.${index}.optional`}
                  render={({ field: optionalField }) => (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Required</span>
                      <Switch
                        checked={!optionalField.value}
                        onCheckedChange={(checked) => {
                          optionalField.onChange(!checked);
                          if (form.getValues().id) form.saveDraft();
                        }}
                        className="scale-75"
                      />
                    </div>
                  )}
                />
              )}
            </div>
            <div className="ring-primary flex items-start rounded-md border has-focus:ring-1">
              <FormField
                control={form.control}
                name={`eligibility.${index}.type`}
                render={({ field: typeField }) => (
                  <FormItem className="w-fit">
                    <Select
                      value={typeField.value}
                      defaultValue="text"
                      onValueChange={(value) => {
                        typeField.onChange(value);
                        if (form.getValues().id) form.saveDraft();
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-fit gap-1 rounded-none border-0 focus:ring-0">
                          <SelectValue className="w-fit">
                            {(() => {
                              const selectedType = questionTypes.find(
                                (qType) => qType.value === typeField.value,
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
                        {questionTypes.map((qType) => (
                          <SelectItem key={qType.value} value={qType.value}>
                            <div className="flex items-center gap-2 text-slate-500">
                              <qType.icon className="h-4 w-4" />
                              {qType.label}
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
                render={({ field: questionField }) => {
                  const questionValue = questionField.value ?? '';
                  const questionLength = questionValue.length;

                  return (
                    <FormItem className="relative w-full border-l">
                      <FormControl>
                        <TextareaAutosize
                          value={questionValue}
                          placeholder="Enter your question"
                          minRows={isFocused ? 2 : 1}
                          rows={1}
                          className="min-h-8 resize-none overflow-hidden border-none py-2 pl-2 text-sm transition-all duration-200 ease-in-out placeholder:text-sm placeholder:text-slate-400 focus:ring-0 focus:outline-hidden focus-visible:ring-0"
                          onChange={(e) => {
                            questionField.onChange(e);
                            form.saveDraft();
                          }}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                        />
                      </FormControl>
                      {(isFocused || questionLength > 200) && (
                        <span
                          className={cn(
                            'absolute right-1 bottom-0 text-[0.625rem] text-slate-400',
                            questionLength > 200 && 'text-red-500',
                            (fieldsLength !== 1 || type !== 'project') &&
                              '-right-7',
                          )}
                        >
                          {questionLength}/200
                        </span>
                      )}
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name={`eligibility.${index}.order`}
                render={({ field: orderField }) => (
                  <input type="hidden" {...orderField} value={index + 1} />
                )}
              />

              {(fieldsLength !== 1 || type !== 'project') && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive invisible flex p-2 group-hover:visible"
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
  );
}

export function EligibilityQuestionsForm() {
  const form = useListingForm();
  const type = useWatch({
    control: form.control,
    name: 'type',
  });

  const questionsContainerRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = useCallback(() => {
    if (questionsContainerRef.current) {
      setTimeout(() => {
        questionsContainerRef.current?.scrollTo({
          top: questionsContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
    }
  }, [questionsContainerRef]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'eligibility',
  });

  const handleAddQuestion = useCallback(
    (focus = true) => {
      append(
        {
          order: fields.length + 1,
          question: '',
          type: 'text',
          optional: false,
        },
        {
          shouldFocus: focus,
        },
      );
      scrollToBottom();
    },
    [append, scrollToBottom, type, fields.length],
  );

  const handleRemoveQuestion = useCallback(
    (index: number) => {
      remove(index);

      if (type === 'project' && index === 0 && fields.length > 1) {
        form.setValue('eligibility.0.optional', false);
      }

      form.saveDraft();
    },
    [form, remove, type, fields.length],
  );

  return (
    <FormField
      control={form.control}
      name={`eligibility`}
      render={() => (
        <FormItem className="flex h-full flex-col gap-2">
          <div className="flex items-center gap-2">
            <FormLabel className="font-medium text-slate-500 uppercase sm:text-xs">
              {type === 'project' ? '' : 'Additional'} Custom Questions
            </FormLabel>
          </div>
          <ScrollArea
            ref={questionsContainerRef}
            className={cn('rounded-md border', fields.length === 0 && 'hidden')}
          >
            <div className="flex min-h-0 shrink flex-col space-y-4 overflow-y-auto p-4">
              {fields.map((field, index) => (
                <EligibilityQuestionItem
                  key={index}
                  field={field}
                  index={index}
                  form={form}
                  type={type}
                  handleRemoveQuestion={handleRemoveQuestion}
                  fieldsLength={fields.length}
                />
              ))}
            </div>
          </ScrollArea>
          {(type !== 'bounty' && type !== 'project') ||
          (type === 'bounty' && fields.length < 5) ||
          (type === 'project' && fields.length < 10) ? (
            <div
              className={cn(
                'flex justify-between',
                fields.length === 0 && 'flex-col gap-2',
              )}
            >
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
              <FormMessage />
            </div>
          ) : (
            <FormDescription>
              {type === 'bounty'
                ? 'You can add up to five custom questions'
                : 'You can add up to ten custom questions'}
            </FormDescription>
          )}
        </FormItem>
      )}
    />
  );
}
