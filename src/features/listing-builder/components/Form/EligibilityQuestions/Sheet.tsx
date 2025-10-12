import { FilePen, Info } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/utils/cn';

import { useListingForm } from '@/features/listing-builder/hooks';

import { DefaultEligibilityQuestions } from './DefaultQs';
import { EligibilityQuestionsForm } from './QuestionsForm';

export function EligibilityQuestionsSheet() {
  const form = useListingForm();
  const [open, setOpen] = useState(false);

  const type = useWatch({
    control: form.control,
    name: 'type',
  });

  const hasEligibilityQsErrors = useMemo(() => {
    const errors = form.formState.errors;
    return (
      errors.eligibility &&
      errors?.eligibility?.some?.((question) => !!question)
    );
  }, [form]);

  const subtext = useMemo(
    () =>
      type === 'project'
        ? `Applicant's names, email IDs, and SOL wallet are collected by default. Please use this space to ask about anything else!`
        : `The main ${type === 'bounty' ? 'bounty' : 'hackathon'} submission link, the submitter's names, email IDs, and SOL wallet are collected by default. Please use this space to ask about anything else!`,
    [type],
  );

  return (
    <Sheet
      open={open}
      onOpenChange={async (e) => {
        setOpen(e);
      }}
    >
      <SheetTrigger className="w-full">
        <FormField
          control={form.control}
          name={`eligibility`}
          render={({ field }) => (
            <FormItem className="items-start gap-1.5 pt-2">
              <div className="flex items-center gap-2">
                <FormLabel isRequired={type === 'project'} className="">
                  Custom Questions
                </FormLabel>
                <Tooltip
                  delayDuration={100}
                  content={<p className="max-w-sm">{subtext}</p>}
                >
                  <Info className="h-3 w-3 text-slate-400" />
                </Tooltip>
              </div>
              <div className="flex w-full items-center gap-2 rounded-md border border-slate-200 bg-slate-50 py-0.5 pl-2">
                <FilePen className="size-4 stroke-[1.5] text-slate-900" />
                <span className="flex items-center">
                  <p className="text-sm font-medium">
                    {field.value?.length || 0}
                  </p>
                  <p className="pl-1 text-sm">
                    Question{(field.value?.length || 0) === 1 ? '' : 's'}
                  </p>
                </span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="ml-auto group-hover:underline"
                >
                  {(field.value?.length || 0) > 0 ? 'Edit' : 'Add'}
                </Button>
              </div>
              {hasEligibilityQsErrors ? (
                <p className={'text-destructive text-[0.8rem] font-medium'}>
                  Please resolve all errors in custom questions
                </p>
              ) : (
                <FormMessage />
              )}
            </FormItem>
          )}
        />
      </SheetTrigger>
      <SheetContent
        showCloseIcon={false}
        side="right"
        className="flex h-[100vh] flex-col p-0 sm:max-w-xl"
      >
        <SheetHeader className={cn('shrink-0 space-y-2 border-b p-6')}>
          <SheetTitle>
            {type === 'project' ? 'Application' : 'Submission'} Form
          </SheetTitle>
          <SheetDescription className={cn('pb-4 text-sm text-slate-500')}>
            {subtext}
            <br />
            Note: All custom questions you add here will be required fields for
            the user.
          </SheetDescription>
          <DefaultEligibilityQuestions />
        </SheetHeader>

        <div
          className={cn('flex min-h-0 flex-1 flex-col p-6 pt-4')}
          id="main-content"
        >
          <EligibilityQuestionsForm />
        </div>

        <div className="shrink-0">
          <Separator className="mb-4" />
          <SheetFooter className="p-6 pt-0">
            <Button
              type="submit"
              className="w-full"
              onClick={async () => {
                if (await form.validateEligibilityQuestions()) {
                  setOpen(false);
                } else {
                  toast.warning(
                    'Please resolve all errors in Custom Questions to Continue',
                  );
                }
              }}
            >
              Continue
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
