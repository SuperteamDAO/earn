'use client';

import { AlertTriangle, Flag } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { SubmissionLabels } from '@/prisma/enums';

import { BONUS_POSITION } from '../../../utils/review-rules';
import {
  useRejectSubmissions,
  useReview,
  useToggleWinner,
  useUpdateLabel,
} from '../review-state';

type ActionType = 'bonus' | 'spam' | 'shortlist';

interface ActionConfig {
  title: string;
  description: string;
  buttonText: string;
  buttonClass: string;
  icon?: React.ReactNode;
  loadingText: string;
  hasWarning?: boolean;
}

interface MultiActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionIds: string[];
  actionType: ActionType;
}

export const MultiActionModal = ({
  isOpen,
  onClose,
  submissionIds,
  actionType,
}: MultiActionModalProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const { setSelectedIds: setSelectedSubmissionIds } = useReview();

  const rejectSubmissions = useRejectSubmissions();
  const toggleWinner = useToggleWinner();
  const updateLabel = useUpdateLabel();

  const isMultiple = submissionIds.length > 1;

  const getActionConfig = (): ActionConfig => {
    switch (actionType) {
      case 'bonus':
        return {
          title: `Select ${submissionIds.length} submission${isMultiple ? 's' : ''} for bonus spot${isMultiple ? 's' : ''}`,
          description: `You are about to select ${submissionIds.length} submissions for Bonus spot${isMultiple ? 's' : ''}. You can update this list till you announce winners.`,
          buttonText: `Allocate Bonus spot(s)`,
          buttonClass:
            'rounded-lg border border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100',
          loadingText: 'Allocating Bonus',
        };

      case 'spam':
        return {
          title: `Mark Submission${isMultiple ? 's' : ''} as Spam?`,
          description: `Marking these submissions as spam would affect the users' ability to submit to other opportunities on Earn.`,
          buttonText: `Mark as Spam`,
          buttonClass:
            'rounded-lg border border-orange-400 bg-orange-50 text-orange-500 hover:bg-orange-100',
          icon: <Flag className="size-2.5 text-orange-500" />,
          loadingText: 'Marking as Spam',
          hasWarning: true,
        };

      case 'shortlist':
        return {
          title: `Shortlist Submission${isMultiple ? 's' : ''}?`,
          description: `You're about to shortlist ${submissionIds.length} submission${isMultiple ? 's' : ''} for further review. You can update this list anytime.`,
          buttonText: `Shortlist ${isMultiple ? 'All' : ''}`,
          buttonClass:
            'rounded-lg border border-purple-300 bg-purple-50 text-purple-600 hover:bg-purple-100',
          loadingText: 'Shortlisting',
        };

      default:
        throw new Error(`Unknown action type: ${String(actionType)}`);
    }
  };

  const handleAction = async () => {
    setLoading(true);
    try {
      switch (actionType) {
        case 'bonus':
          await toggleWinner(
            submissionIds.map((s) => ({
              id: s,
              isWinner: true,
              winnerPosition: BONUS_POSITION,
            })),
          );
          setSelectedSubmissionIds(new Set());
          break;
        case 'spam':
          await updateLabel(submissionIds, SubmissionLabels.Spam);
          void rejectSubmissions(submissionIds);
          setSelectedSubmissionIds(new Set());
          break;
        case 'shortlist':
          await updateLabel(submissionIds, SubmissionLabels.Shortlisted);
          setSelectedSubmissionIds(new Set());
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Error performing ${actionType} action:`, error);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const config = getActionConfig();

  return (
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
              onClick={() => void handleAction()}
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
};
