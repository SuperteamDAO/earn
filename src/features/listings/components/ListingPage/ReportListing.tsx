import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';
import { BiCheck } from 'react-icons/bi';
import { RiFlagFill } from 'react-icons/ri';
import TextareaAutosize from 'react-textarea-autosize';

import { AnimateChangeInHeight } from '@/components/shared/AnimateChangeInHeight';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/utils/cn';

export interface ReportListingProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface RadioOptionLabelProps {
  label: string;
  description?: string;
}

function RadioOptionLabel({ label, description }: RadioOptionLabelProps) {
  return (
    <div>
      <div className="font-medium">{label}</div>
      <div className="text-sm text-slate-500 group-has-checked:text-slate-600">
        {description}
      </div>
    </div>
  );
}

function CustomRadioGroupItem(
  props: React.ComponentProps<typeof RadioGroupItem>,
) {
  return (
    <RadioGroupItem
      {...props}
      className={
        'data-[state=checked]:border-primary !size-6 border-slate-300 focus-visible:ring-0'
      }
      classNames={{
        circleIcon: 'size-4',
      }}
    />
  );
}

interface RadioOptionRowProps {
  value: string;
  ariaLabel: string;
  label: string;
  description?: string;
  children?: React.ReactNode;
}

function RadioOptionRow({
  value,
  ariaLabel,
  label,
  description,
  children,
}: RadioOptionRowProps) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 rounded bg-slate-100 p-3 text-slate-600 transition-all duration-75 has-checked:bg-indigo-100 has-checked:text-indigo-600">
      <CustomRadioGroupItem value={value} aria-label={ariaLabel} />
      <div className="w-full">
        <AnimateChangeInHeight>
          <RadioOptionLabel label={label} description={description} />
        </AnimateChangeInHeight>
        {children}
      </div>
    </label>
  );
}

export function ReportListing({ open, onOpenChange }: ReportListingProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [submitted, setSubmitted] = React.useState(false);
  const [selectedReason, setSelectedReason] = React.useState<string | null>(
    null,
  );
  const [customReason, setCustomReason] = React.useState('');

  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setSubmitted(false);
        setSelectedReason(null);
        setCustomReason('');
      }, 500);
    }
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="p-0">
          <MainContent
            submitted={submitted}
            selectedReason={selectedReason}
            setSelectedReason={setSelectedReason}
            customReason={customReason}
            setCustomReason={setCustomReason}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="p-0">
        <MainContent
          submitted={submitted}
          selectedReason={selectedReason}
          setSelectedReason={setSelectedReason}
          customReason={customReason}
          setCustomReason={setCustomReason}
          onSubmit={handleSubmit}
        />
      </DrawerContent>
    </Drawer>
  );
}

interface MainContentProps {
  submitted: boolean;
  selectedReason: string | null;
  setSelectedReason: (v: string) => void;
  customReason: string;
  setCustomReason: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

function MainContent({
  submitted,
  selectedReason,
  setSelectedReason,
  customReason,
  setCustomReason,
  onSubmit,
}: MainContentProps) {
  return (
    <AnimateChangeInHeight>
      <AnimatePresence mode="popLayout">
        {submitted ? (
          <motion.div
            key="thankyou"
            initial={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center justify-center gap-6 py-6">
              <div className="flex items-center justify-center rounded-full bg-indigo-100 p-1">
                <BiCheck className="size-18 text-indigo-600" />
              </div>
              <div className="flex flex-col items-center gap-2 px-6">
                <div className="text-center text-base font-medium text-slate-900">
                  Thank you for reporting this listing!
                </div>
                <div className="text-center text-sm font-medium text-slate-400">
                  We&apos;ll take a look at this report. <br />
                  Thanks for flagging — we appreciate it!
                </div>
              </div>
              <div className="h-px w-full bg-slate-200" />
              <div className="flex w-full items-center justify-center gap-2 px-6">
                <div className="text-center text-sm font-medium text-slate-400">
                  Want to take this further?
                </div>
                <Button
                  asChild
                  variant="link"
                  className="h-fit p-0 text-slate-500 underline underline-offset-3"
                >
                  <a
                    href="mailto:support@superteamearn.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contact us
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-6 p-6">
              <div className="mb-4 flex items-center gap-2">
                <RiFlagFill />
                <span className="text-lg font-medium">Report this listing</span>
              </div>
              <form className="space-y-4" onSubmit={onSubmit}>
                <RadioGroup
                  value={selectedReason || ''}
                  onValueChange={setSelectedReason}
                  className="space-y-3"
                >
                  <RadioOptionRow
                    value="suspicious-sponsor"
                    ariaLabel="Suspicious Sponsor"
                    label="Suspicious Sponsor"
                    description="Sponsor appears to be scamming, sending phishing links, or behaving maliciously."
                  />
                  <RadioOptionRow
                    value="fake-winners"
                    ariaLabel="Fake / Ineligible Winners"
                    label="Fake / Ineligible Winners"
                    description="The listing is vague, contradictory, or missing essential information."
                  />
                  <RadioOptionRow
                    value="unclear-scope"
                    ariaLabel="Unclear Scope"
                    label="Unclear Scope"
                    description="The listing is vague, contradictory, or missing essential information."
                  />
                  <AnimateChangeInHeight>
                    <RadioOptionRow
                      value="other"
                      ariaLabel="Something else wrong with the listing?"
                      label="Something else wrong with the listing?"
                      description={
                        selectedReason === 'other'
                          ? ''
                          : "Describe what's wrong with this listing..."
                      }
                    />
                    <span className="block h-0 w-full" />
                    {selectedReason === 'other' && (
                      <TextareaAutosize
                        className={cn(
                          'mt-4 w-full resize-none rounded-none border-b-2 p-2 text-sm',
                          'focus:border-indigo-400 focus:ring-0 focus:outline-hidden',
                          'max-h-32 min-h-8 placeholder:text-slate-400',
                        )}
                        rows={3}
                        placeholder="Describe what's wrong with this listing..."
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                      />
                    )}
                  </AnimateChangeInHeight>
                </RadioGroup>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    !selectedReason ||
                    (selectedReason === 'other' && !customReason.trim())
                  }
                >
                  Send Report
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimateChangeInHeight>
  );
}
