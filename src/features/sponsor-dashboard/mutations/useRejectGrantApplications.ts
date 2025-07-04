import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { toast } from 'sonner';

import { GrantApplicationStatus } from '@/interface/prisma/enums';
import { api } from '@/lib/api';

import { selectedGrantApplicationAtom } from '../atoms';
import { type GrantApplicationsReturn } from '../queries/applications';
import { type GrantApplicationWithUser } from '../types';

export const useRejectGrantApplications = (slug: string) => {
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useAtom(
    selectedGrantApplicationAtom,
  );

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

  return useMutation({
    mutationFn: async (applicationIds: string[]) => {
      const batchSize = 10;
      for (let i = 0; i < applicationIds.length; i += batchSize) {
        const batch = applicationIds.slice(i, i + batchSize);
        await api.post(
          '/api/sponsor-dashboard/grants/update-application-status',
          {
            data: batch.map((id) => ({ id })),
            applicationStatus: 'Rejected',
          },
        );
      }
      return applicationIds;
    },
    onMutate: async (applicationIds) => {
      await queryClient.cancelQueries({
        queryKey: ['sponsor-applications', slug],
      });

      const previousApplications =
        queryClient.getQueryData<GrantApplicationsReturn>([
          'sponsor-applications',
          slug,
        ]);

      queryClient.setQueryData<GrantApplicationsReturn>(
        ['sponsor-applications', slug],
        (oldData) => {
          if (!oldData) return oldData;

          const updatedData = oldData.data.map((application) =>
            applicationIds.includes(application.id)
              ? {
                  ...application,
                  applicationStatus: GrantApplicationStatus.Rejected,
                  label:
                    application.label === 'Unreviewed' ||
                    application.label === 'Pending'
                      ? 'Reviewed'
                      : application.label,
                }
              : application,
          );

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

          return {
            ...oldData,
            data: updatedData,
          };
        },
      );

      return { previousApplications };
    },
    onError: (_, applicationIds, context) => {
      if (context?.previousApplications) {
        queryClient.setQueryData<GrantApplicationsReturn>(
          ['sponsor-applications', slug],
          context.previousApplications,
        );
      }

      const errorMessage =
        applicationIds.length === 1
          ? 'Failed to reject grant application. Please try again.'
          : 'An error occurred while rejecting applications. Please try again.';

      toast.error(errorMessage);
    },
    onSuccess: (applicationIds) => {
      queryClient.invalidateQueries({
        queryKey: ['sponsor-applications', slug],
      });

      const successMessage =
        applicationIds.length === 1
          ? 'Application rejected successfully'
          : 'Applications rejected successfully';

      toast.success(successMessage);
    },
  });
};
