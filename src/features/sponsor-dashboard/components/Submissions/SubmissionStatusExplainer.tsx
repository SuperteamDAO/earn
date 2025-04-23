import { type SubmissionWithUser } from '@/interface/submission';

import { sponsorshipSubmissionStatus } from '@/features/listings/components/SubmissionsPage/SubmissionTable';
import { colorMap } from '@/features/sponsor-dashboard/utils/statusColorMap';

const statusExplanation = (
  status: ReturnType<typeof sponsorshipSubmissionStatus>,
) => {
  switch (status) {
    case 'Paid':
      return {
        final: true,
      };
    case 'Approved':
      return {
        approved: true,
        locked: true,
        waitingForPayment: true,
      };
    case 'Rejected':
      return {
        final: true,
      };
    case 'Spam':
      return {
        blocked: true,
      };
    case 'Reviewed':
      return {
        locked: true,
        waitingForSponsor: true,
      };
    case 'Shortlisted':
      return {
        waitingForSponsor: true,
        locked: true,
      };
    case 'New':
      return {
        waitingForSponsor: true,
        editable: true,
      };
    case 'Deleted':
      return {};
  }
};
export default function SubmissionStatusExplanation({
  submission,
}: {
  submission: SubmissionWithUser | undefined;
}) {
  if (!submission) return null;

  const sponsorshipStatus = sponsorshipSubmissionStatus(submission);
  if (sponsorshipStatus === 'Deleted') return null;
  const explanation = statusExplanation(sponsorshipStatus);
  const statusColors = colorMap[sponsorshipStatus as keyof typeof colorMap];

  return (
    <div className="flex w-full">
      <div
        className={`w-full rounded-lg p-4 ${statusColors.bg} ${statusColors.color}`}
      >
        <div className="flex flex-col space-y-2">
          <h3 className="text-sm font-semibold">Status: {sponsorshipStatus}</h3>
          <ul className="list-inside list-disc space-y-1 text-sm">
            {explanation.waitingForSponsor && (
              <li>The sponsor action is required</li>
            )}
            {explanation.waitingForPayment && (
              <li>
                The submission is waiting for the sponsor to pay the recipient
              </li>
            )}
            {explanation.editable && (
              <li>The submission can be edited by the submitter</li>
            )}
            {explanation.locked && (
              <li>The submission is locked and cannot be edited</li>
            )}
            {explanation.final && (
              <>
                <li>The submission has reached its final state</li>
              </>
            )}
            {explanation.approved ||
              (explanation.final && (
                <li>The submitter can create a new submission</li>
              ))}
            {explanation.blocked && (
              <>
                <li>The submission has been marked as spam</li>
                <li>
                  The submitter blocked from creating new submissions to this
                  listing
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
