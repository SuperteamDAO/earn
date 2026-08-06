import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface MobileDesktopOnlyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  actionLabel?: string;
}

export const MobileDesktopOnlyDialog = ({
  open,
  onOpenChange,
  title,
  description,
  actionLabel = 'Understood',
}: MobileDesktopOnlyDialogProps) => {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseIcon
        className="max-h-[calc(100dvh-1rem)] max-w-[calc(100vw-1rem)] overflow-hidden p-0 sm:max-w-md"
      >
        <div className="space-y-4 p-5">
          <div className="space-y-1">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              {title}
            </DialogTitle>
            <p className="text-sm leading-6 text-slate-500">{description}</p>
          </div>
          <div className="flex justify-end">
            <Button
              className="w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
            >
              {actionLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
