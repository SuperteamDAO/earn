import { AlertTriangle } from 'lucide-react';
import { type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

export interface ActionConfig {
  title: string;
  description: string;
  buttonText: string;
  buttonClass: string;
  icon?: ReactNode;
  loadingText: string;
  hasWarning?: boolean;
}

interface MultiActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  config: ActionConfig;
  loading: boolean;
  onAction: () => void;
}

export const MultiActionDialog = ({
  isOpen,
  onClose,
  config,
  loading,
  onAction,
}: MultiActionDialogProps) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="m-0 p-0" hideCloseIcon>
      <DialogTitle className="text-md -mb-1 px-6 pt-4 font-semibold text-slate-900">
        {config.title}
      </DialogTitle>
      <Separator />
      <div className="px-6 pb-6 text-[0.95rem]">
        <p className="mb-4 text-slate-500">{config.description}</p>

        {config.hasWarning && (
          <div className="mb-4 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-slate-800">
              This action cannot be undone!
            </span>
          </div>
        )}
        <div className="flex gap-3">
          <div className="w-1/2" />
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Close
          </Button>
          <Button
            className={`flex-1 ${config.buttonClass}`}
            disabled={loading}
            onClick={onAction}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner mr-2" />
                <span>{config.loadingText}</span>
              </>
            ) : (
              <>
                {config.icon}
                {config.buttonText}
              </>
            )}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
