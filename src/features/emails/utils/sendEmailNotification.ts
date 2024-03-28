import axios from 'axios';

type EmailType =
  | 'addPayment'
  | 'announceWinners'
  | 'commentSponsor'
  | 'commentSubmission'
  | 'createListing'
  | 'deadlineExtended'
  | 'submissionLike'
  | 'submissionSponsor'
  | 'submissionTalent'
  | 'superteamWinners';

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
  } catch (error) {
    console.error(`failed to send email for ${type} with ID ${id}: ${error}`);
    throw error;
  }
}
