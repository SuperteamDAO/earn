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
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';

import { RichEditor } from '@/components/shared/RichEditor';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/utils/cn';

import { hackathonAtom } from '../../atoms';
import { useListingForm } from '../../hooks';

const questionTypes = [
  { value: 'text', label: 'Text', icon: Baseline },
  { value: 'paragraph', label: 'Paragraph', icon: LetterText },
  { value: 'link', label: 'Link', icon: Link2 },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
];

function SortableItem({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50',
      )}
      {...attributes}
      {...listeners}
    >
      {children}
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
                    ? `Applicant's names, email IDs, Discord / Twitter IDs, and NEAR wallet are collected by default. Please use this space to ask about anything else!`
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
                  <SortableItem key={field.id} id={field.id}>
                    <div className="bg-white">
                      <FormField
                        control={form.control}
                        name={`eligibility.${index}.question`}
                        render={() => (
                          <FormItem className="gap-2">
                            <FormLabel
                              isRequired={
                                (type === 'project' ||
                                  type === 'sponsorship') &&
                                index === 0
                              }
                            >
                              Question {index + 1}
                            </FormLabel>
                            <div className="relative flex rounded-md border ring-primary has-[:focus]:ring-1">
                              <div className="flex items-center justify-center border-r bg-slate-50">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex w-full cursor-text items-center">
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
                                          if (form.getValues().id)
                                            form.saveDraft();
                                        }}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="w-fit gap-1 rounded-none border-0 focus:ring-0">
                                            <SelectValue className="w-fit">
                                              {(() => {
                                                const selectedType =
                                                  questionTypes.find(
                                                    (type) =>
                                                      type.value ===
                                                      field.value,
                                                  );
                                                if (!selectedType)
                                                  return 'Type';
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
                                    <FormItem className="flex-1 border-l">
                                      <FormControl>
                                        {form.getValues()?.eligibility?.[index]
                                          ?.type === 'checkbox' ? (
                                          <RichEditor
                                            {...field}
                                            id={`eligibilityAnswers.${index}.answer`}
                                            value={field.value || ''}
                                            error={false}
                                            placeholder={
                                              'Enter text for checkbox...'
                                            }
                                            className="border-none"
                                          />
                                        ) : (
                                          <Input
                                            {...field}
                                            placeholder="Enter your question"
                                            className="border-none focus-visible:ring-0"
                                            value={field.value || ''}
                                            onChange={(e) => {
                                              field.onChange(e);
                                              form.saveDraft();
                                            }}
                                            onBlur={() => null}
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
                                    <input
                                      type="hidden"
                                      {...field}
                                      value={index + 1}
                                    />
                                  )}
                                />

                                {(fields.length !== 1 ||
                                  (type !== 'project' &&
                                    type !== 'sponsorship')) && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 hidden h-full text-muted-foreground group-hover:flex hover:text-destructive"
                                    onClick={() => handleRemoveQuestion(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeId ? (
                <div className="w-full rounded-md bg-white opacity-80 shadow-lg">
                  {fields.map((field, index) =>
                    field.id === activeId ? (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={`eligibility.${index}.question`}
                        render={() => (
                          <FormItem className="gap-2">
                            <FormLabel
                              isRequired={
                                (type === 'project' ||
                                  type === 'sponsorship') &&
                                index === 0
                              }
                            >
                              Question {index + 1}
                            </FormLabel>
                            <div className="relative flex rounded-md border ring-primary has-[:focus]:ring-1">
                              <div className="flex items-center justify-center border-r bg-slate-50">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex w-full items-center">
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
                                          if (form.getValues().id)
                                            form.saveDraft();
                                        }}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="w-fit gap-1 rounded-none border-0 focus:ring-0">
                                            <SelectValue className="w-fit">
                                              {(() => {
                                                const selectedType =
                                                  questionTypes.find(
                                                    (type) =>
                                                      type.value ===
                                                      field.value,
                                                  );
                                                if (!selectedType)
                                                  return 'Type';
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
                                    <FormItem className="flex-1 border-l">
                                      <FormControl>
                                        {form.getValues()?.eligibility?.[index]
                                          ?.type === 'checkbox' ? (
                                          <RichEditor
                                            {...field}
                                            id={`eligibilityAnswers.${index}.answer`}
                                            value={field.value || ''}
                                            error={false}
                                            placeholder={
                                              'Enter text for checkbox...'
                                            }
                                            className="border-none"
                                          />
                                        ) : (
                                          <Input
                                            {...field}
                                            placeholder="Enter your question"
                                            className="border-none focus-visible:ring-0"
                                            value={field.value || ''}
                                            onChange={(e) => {
                                              field.onChange(e);
                                              form.saveDraft();
                                            }}
                                            onBlur={() => null}
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
                                    <input
                                      type="hidden"
                                      {...field}
                                      value={index + 1}
                                    />
                                  )}
                                />

                                {(fields.length !== 1 ||
                                  (type !== 'project' &&
                                    type !== 'sponsorship')) && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 hidden h-full text-muted-foreground group-hover:flex hover:text-destructive"
                                    onClick={() => handleRemoveQuestion(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
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
