'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { submissionsQuery } from '@/features/sponsor-dashboard/queries/submissions';

import { useCreateDummySubmissions } from './mutation';
import {
  type DummySubmissionsInput,
  type DummySubmissionsSchema,
  dummySubmissionsSchema,
} from './schema';

interface DummySubmissionsProps {
  listingId: string;
  slug?: string;
}

export function DummySubmissionsForm({
  listingId,
  slug,
}: DummySubmissionsProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const createDummySubmissions = useCreateDummySubmissions();

  const form = useForm<DummySubmissionsInput, unknown, DummySubmissionsSchema>({
    resolver: zodResolver(dummySubmissionsSchema),
    defaultValues: {
      listingId,
      count: 5,
    },
  });

  const onSubmit = (data: DummySubmissionsSchema) => {
    createDummySubmissions.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        if (slug) {
          queryClient.invalidateQueries(submissionsQuery(slug));
        }
      },
    });
  };

  const handleIncrement = () => {
    const currentValue = form.getValues('count');
    const newValue = Math.min(currentValue + 1, 30);
    form.setValue('count', newValue);
  };

  const handleDecrement = () => {
    const currentValue = form.getValues('count');
    const newValue = Math.max(currentValue - 1, 1);
    form.setValue('count', newValue);
  };

  if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed right-6 bottom-6 z-50">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className="h-fit w-fit rounded-full p-4 text-slate-800 shadow-lg"
            disabled={createDummySubmissions.isPending}
            variant="outline"
          >
            <Plus className="size-6!" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <h4 className="leading-none font-medium">
                  Create Dummy Submissions
                </h4>
                <p className="text-muted-foreground text-sm">
                  Generate fake submissions for testing purposes
                </p>
              </div>
              <FormField
                control={form.control}
                name="count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of submissions</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value) || 0)
                          }
                          onKeyDown={(e) => {
                            // Only handle arrow keys if no modifier keys are pressed
                            // This prevents interference with other keyboard shortcuts
                            if (
                              !e.ctrlKey &&
                              !e.altKey &&
                              !e.metaKey &&
                              !e.shiftKey
                            ) {
                              if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                e.stopPropagation();
                                handleIncrement();
                              } else if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDecrement();
                              }
                            }
                          }}
                          disabled={createDummySubmissions.isPending}
                          className="pr-12"
                        />
                      </FormControl>
                      <div className="absolute top-1/2 right-2 flex -translate-y-1/2 flex-col">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-slate-100"
                          onClick={handleIncrement}
                          disabled={createDummySubmissions.isPending}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-slate-100"
                          onClick={handleDecrement}
                          disabled={createDummySubmissions.isPending}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={createDummySubmissions.isPending}
              >
                {createDummySubmissions.isPending ? 'Creating...' : 'Create'}
              </Button>
            </form>
          </Form>
        </PopoverContent>
      </Popover>
    </div>
  );
}
