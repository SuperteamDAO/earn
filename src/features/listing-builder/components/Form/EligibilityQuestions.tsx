import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAtomValue } from 'jotai';
import {
  Baseline,
  CheckSquare,
  GripVertical,
  Info,
  LetterText,
  Link2,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  type FieldArrayWithId,
  useFieldArray,
  useWatch,
} from 'react-hook-form';

import { RichEditor } from '@/components/shared/RichEditor';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/utils/cn';

import { hackathonAtom } from '../../atoms';
import { useListingForm } from '../../hooks';

// Define the interface for eligibility question based on the schema
interface EligibilityQuestion {
  order: number;
  question: string;
  description?: string | null;
  type: 'text' | 'paragraph' | 'link' | 'checkbox';
  optional?: boolean;
}

interface QuestionSettingsDialogProps {
  index: number;
}

function QuestionSettingsPopover({ index }: QuestionSettingsDialogProps) {
  const form = useListingForm();

  const changeBoolean = (field: any) => {
    field.onChange(!field.value);
    form.saveDraft();
  };
  return (
    <FormField
      control={form.control}
      name={`eligibility.${index}.optional`}
      render={({ field }) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-auto p-1 text-muted-foreground text-slate-700 hover:bg-transparent hover:text-black"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="left" className="w-72 p-4" align="end">
            <div className="space-y-2">
              <h4 className="font-medium">Question Options</h4>
              <div className="flex flex-row items-start space-x-3 space-y-0">
                <Checkbox
                  checked={field.value === true}
                  onClick={() => changeBoolean(field)}
                />
                <div
                  className="cursor-pointer space-y-1 leading-none"
                  onClick={() => changeBoolean(field)}
                >
                  <FormLabel className="cursor-pointer">Optional</FormLabel>
                  <FormDescription className="text-xs">
                    Makes the question optional for applicants
                  </FormDescription>
                  <FormMessage />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    />
  );
}

const questionTypes = [
  { value: 'text', label: 'Text', icon: Baseline },
  { value: 'paragraph', label: 'Paragraph', icon: LetterText },
  { value: 'link', label: 'Link', icon: Link2 },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
];

interface QuestionTypeSelectProps {
  index: number;
}

function QuestionTypeSelect({ index }: QuestionTypeSelectProps) {
  const form = useListingForm();

  return (
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
              <SelectTrigger className="h-fit w-fit gap-1 rounded-none border-0 py-2 focus:ring-0">
                <SelectValue className="w-fit">
                  {(() => {
                    const selectedType = questionTypes.find(
                      (type) => type.value === field.value,
                    );
                    if (!selectedType) return 'Type';
                    const Icon = selectedType.icon;
                    return (
                      <Icon className="h-[14px] w-[14px] text-slate-500" />
                    );
                  })()}
                </SelectValue>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {questionTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2 text-slate-500">
                    <type.icon className="h-[14px] w-[14px]" />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
}

interface EligibilityQuestionProps {
  index: number;
  id: string;
  fields: FieldArrayWithId<any, 'eligibility', 'id'>[];
  handleRemoveQuestion: (index: number) => void;
}

function EligibilityQuestion({
  index,
  fields,
  handleRemoveQuestion,
  id,
}: EligibilityQuestionProps) {
  const form = useListingForm();
  const type = useWatch({
    control: form.control,
    name: 'type',
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: '100%',
    height: 'auto',
  };

  const questionData = form.getValues().eligibility?.[index] as
    | EligibilityQuestion
    | undefined;

  // Add useEffect to adjust textarea height on mount and value change
  useEffect(() => {
    const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    };

    const questionTextarea = document.querySelector(
      `textarea[name="eligibility.${index}.question"]`,
    ) as HTMLTextAreaElement;
    const descriptionTextarea = document.querySelector(
      `textarea[name="eligibility.${index}.description"]`,
    ) as HTMLTextAreaElement;

    if (questionTextarea) {
      adjustTextareaHeight(questionTextarea);
    }
    if (descriptionTextarea) {
      adjustTextareaHeight(descriptionTextarea);
    }
  }, [index]);

  return (
    <div className="bg-white" ref={setNodeRef} style={style}>
      <FormField
        control={form.control}
        name={`eligibility.${index}.question`}
        render={() => {
          const { type: questionType, question } =
            form.getValues()?.eligibility?.[index] ?? {};
          return (
            <div className="group relative">
              <FormItem className="rounded-lg border">
                <div
                  className={cn(
                    'flex cursor-grab items-center justify-between border-b active:cursor-grabbing',
                    isDragging && 'opacity-50',
                  )}
                  {...attributes}
                  {...listeners}
                >
                  <div className="flex gap-2">
                    <div className="flex justify-around">
                      <div className="flex items-center gap-2">
                        <GripVertical className="ml-2 h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                    <FormLabel
                      isRequired={
                        (type === 'project' || type === 'sponsorship') &&
                        index === 0
                      }
                      className="after:content-none"
                    >
                      <span className="text-muted-foreground">
                        Question {index + 1}
                        <span className="text-red-500">
                          {questionData?.optional !== true && ' *'}
                        </span>
                      </span>
                    </FormLabel>
                  </div>
                  <QuestionTypeSelect index={index} />
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name={`eligibility.${index}.question`}
                    render={({ field }) => (
                      <FormItem className="">
                        <FormControl>
                          {questionType === 'checkbox' ? (
                            <RichEditor
                              {...field}
                              id={`eligibilityAnswers.${index}.answer`}
                              value={field.value || ''}
                              error={false}
                              placeholder={'Enter text for checkbox...'}
                              className="border-none ring-transparent focus-visible:ring-0 [&_p]:text-muted-foreground"
                            />
                          ) : (
                            <Textarea
                              {...field}
                              placeholder="Enter your question"
                              className="min-h-[20px] resize-none overflow-hidden border-none font-medium !text-muted-foreground shadow-none focus-visible:ring-0"
                              value={field.value || ''}
                              onChange={(e) => {
                                field.onChange(e);
                                form.saveDraft();
                                e.target.style.height = 'auto';
                                e.target.style.height =
                                  e.target.scrollHeight + 'px';
                              }}
                              onBlur={() => null}
                              rows={1}
                            />
                          )}
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

                  {questionType !== 'checkbox' &&
                    question &&
                    question.length > 0 && (
                      <FormField
                        control={form.control}
                        name={`eligibility.${index}.description`}
                        render={({ field }) => (
                          <FormItem className="h-full">
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Write a description if necessary"
                                className={cn(
                                  'h-fit min-h-[20px] resize-none overflow-hidden border-none pt-0 !text-xs !text-muted-foreground ring-transparent transition-transform duration-300 ease-out animate-in slide-in-from-top-4 focus-visible:ring-0',
                                  field.value && 'opacity-100',
                                )}
                                value={field.value || ''}
                                rows={1}
                                onChange={(e) => {
                                  field.onChange(e);
                                  form.saveDraft();
                                  e.target.style.height = 'auto';
                                  e.target.style.height =
                                    e.target.scrollHeight + 'px';
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                </div>
              </FormItem>
              <FormMessage />

              <div className="absolute right-0 top-0 flex translate-x-full transform opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex flex-col">
                  {(fields.length !== 1 ||
                    (type !== 'project' && type !== 'sponsorship')) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="hover:bg-transparent hover:text-destructive"
                      onClick={() => handleRemoveQuestion(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <QuestionSettingsPopover index={index} />
                </div>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}

export function EligibilityQuestions() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const form = useListingForm();
  const type = useWatch({
    control: form.control,
    name: 'type',
  });
  const hackathon = useAtomValue(hackathonAtom);

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'eligibility',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field.id === active.id);
      const newIndex = fields.findIndex((field) => field.id === over.id);

      move(oldIndex, newIndex);

      // Update order for all questions
      fields.forEach((_, index) => {
        form.setValue(`eligibility.${index}.order`, index + 1);
      });

      form.saveDraft();
    }
  };

  const handleAddQuestion = (focus = true) => {
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
  };

  const handleRemoveQuestion = (index: number) => {
    remove(index);
    form.saveDraft();
  };

  useEffect(() => {
    if (type === 'project' || type === 'sponsorship') {
      if (fields.length === 0) {
        handleAddQuestion(false);
      }
    } else {
      if (type === 'hackathon' && hackathon?.eligibility) {
        form.setValue('eligibility', hackathon?.eligibility as any);
      } else {
        form.setValue('eligibility', []);
      }
    }
  }, [type, hackathon]);

  return (
    <FormField
      control={form.control}
      name={`eligibility`}
      render={() => (
        <FormItem className="gap-2 pt-2">
          <div className="flex items-center gap-2">
            <FormLabel className="font-bold uppercase text-slate-400">
              Custom Questions
            </FormLabel>
            <Tooltip
              delayDuration={100}
              content={
                <p className="max-w-sm">
                  {type === 'project' || type === 'sponsorship'
                    ? `Applicant's names, email IDs, Discord / Twitter IDs, and NEAR wallet are collected by default. Please use this space to ask about anything else! At least one question is required.`
                    : `The main bounty submission link, the submitter's names, email IDs, Discord / Twitter IDs, and NEAR wallet are collected by default. Please use this space to ask about anything else!`}
                </p>
              }
            >
              <Info className="h-3 w-3 text-slate-400" />
            </Tooltip>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fields.map((field) => field.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <EligibilityQuestion
                    key={field.id}
                    id={field.id}
                    index={index}
                    fields={fields}
                    handleRemoveQuestion={handleRemoveQuestion}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeId ? (
                <div className="w-full rounded-md bg-white opacity-80 shadow-lg">
                  {fields.map((field, index) =>
                    field.id === activeId ? (
                      <EligibilityQuestion
                        id={activeId}
                        key={activeId}
                        index={index}
                        fields={fields}
                        handleRemoveQuestion={handleRemoveQuestion}
                      />
                    ) : null,
                  )}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
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
                <Plus /> Add Question
              </Button>
            </div>
          ) : (
            <FormDescription>
              Max two custom questions allow for bounties
            </FormDescription>
          )}
        </FormItem>
      )}
    />
  );
}
