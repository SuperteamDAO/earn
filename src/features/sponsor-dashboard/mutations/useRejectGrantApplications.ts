'use client';

import { toast } from 'sonner';

import { postJson } from '@/lib/fetch-json';
import { GrantApplicationStatus } from '@/prisma/enums';

import { useGrantReview } from '../components/GrantApplications/GrantReviewContext';
import type { GrantApplicationStatusMutationResponse } from '../constants/grantApplicationMutation';
import type { GrantApplicationWithUser } from '../types';

type RejectGrantApplicationsInput =
  | string[]
  | {
      applicationIds: string[];
      customNote?: string;
      skipCooldown?: boolean;
    };

const parseRejectGrantApplicationsInput = (
  input: RejectGrantApplicationsInput,
) => {
  if (Array.isArray(input)) {
    return { applicationIds: input };
  }

  return input;
};

// Rejects applications, ten at a time, showing it before the server
// answers.
export const useRejectGrantApplications = () => {
  const {
    applications,
    setApplications,
    selectedApplication,
    setSelectedApplication,
    refresh,
  } = useGrantReview();

  const moveToNextPendingApplication = (
    rejectedApplicationIds: string[],
    updatedApplications: GrantApplicationWithUser[],
  ) => {
    if (
      !selectedApplication?.id ||
      !rejectedApplicationIds.includes(selectedApplication.id)
    ) {
      return;
    }

    const currentIndex = updatedApplications.findIndex(
      (app) => app.id === selectedApplication.id,
    );
    if (currentIndex === -1) return;

    const nextPendingApplication = updatedApplications
      .slice(currentIndex + 1)
      .find(
        (app) =>
          app.applicationStatus === GrantApplicationStatus.Pending &&
          !rejectedApplicationIds.includes(app.id),
      );

    if (nextPendingApplication) {
      setSelectedApplication(nextPendingApplication);
    } else {
      const firstPendingApplication = updatedApplications.find(
        (app) =>
          app.applicationStatus === GrantApplicationStatus.Pending &&
          !rejectedApplicationIds.includes(app.id),
      );
      if (firstPendingApplication) {
        setSelectedApplication(firstPendingApplication);
      }
    }
  };

  const reject = async (input: RejectGrantApplicationsInput) => {
    const { applicationIds, customNote, skipCooldown } =
      parseRejectGrantApplicationsInput(input);

    const previousApplications = applications;
    const updatedData = applications.map((application) =>
      applicationIds.includes(application.id)
        ? {
            ...application,
            applicationStatus: GrantApplicationStatus.Rejected,
            isCooldownSkipped: !!skipCooldown,
            label:
              application.label === 'Unreviewed' ||
              application.label === 'Pending'
                ? ('Reviewed' as const)
                : application.label,
          }
        : application,
    );
    setApplications(updatedData);
    if (
      selectedApplication?.id &&
      applicationIds.includes(selectedApplication.id)
    ) {
      const updatedSelectedApplication = updatedData.find(
        (application) => application.id === selectedApplication.id,
      );
      if (updatedSelectedApplication) {
        setSelectedApplication(updatedSelectedApplication);
      }
      moveToNextPendingApplication(applicationIds, updatedData);
    }

    try {
      const reviewerNote = customNote?.trim();
      const batchSize = 10;
      for (let i = 0; i < applicationIds.length; i += batchSize) {
        const batch = applicationIds.slice(i, i + batchSize);
        await postJson<GrantApplicationStatusMutationResponse>(
          '/api/sponsor-dashboard/grants/update-application-status/',
          {
            data: batch.map((id) => ({ id })),
            applicationStatus: 'Rejected',
            ...(reviewerNote ? { customNote: reviewerNote } : {}),
            ...(skipCooldown ? { skipCooldown } : {}),
          },
        );
      }
      refresh();
      toast.success(
        applicationIds.length === 1
          ? 'Application rejected successfully'
          : 'Applications rejected successfully',
      );
    } catch {
      setApplications(previousApplications);
      toast.error(
        applicationIds.length === 1
          ? 'Failed to reject grant application. Please try again.'
          : 'An error occurred while rejecting applications. Please try again.',
      );
    }
  };

  return {
    mutate: (input: RejectGrantApplicationsInput) => void reject(input),
  };
};
