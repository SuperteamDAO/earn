import axios from 'axios';

type EmailType =
  | 'addPayment'
  | 'announceWinners'
  | 'commentSponsor'
  | 'commentSubmission'
  | 'createListing'
  | 'deadline3days'
  | 'deadlineExceeded'
  | 'deadlineExceededWeek'
  | 'deadlineExtended'
  | 'submissionLike'
  | 'submissionSponsor'
  | 'submissionTalent'
  | 'superteamWinners'
  | 'weeklyListingRoundup';

interface EmailNotificationParams {
  type: EmailType;
  id: string;
  userId?: string;
}

export async function sendEmailNotification({
  type,
  id,
  userId,
}: EmailNotificationParams) {
  try {
    await axios.post(process.env.EMAIL_BACKEND!, { type, id, userId });
    console.log(`email sent successfully for ${type} with ID ${id}`);
  } catch (error) {
    console.error(`failed to send email for ${type} with ID ${id}: ${error}`);
    throw error;
  }
}
