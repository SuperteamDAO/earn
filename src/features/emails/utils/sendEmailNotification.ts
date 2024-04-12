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
  | 'superteamWinners'
  | 'commentReply'
  | 'commentTag';

interface EmailNotificationParams {
  type: EmailType;
  id: string;
  userId?: string;
  otherInfo?: any;
}

export async function sendEmailNotification({
  type,
  id,
  userId, // pass userId of the person you are sending the email to
  otherInfo,
}: EmailNotificationParams) {
  try {
    await axios.post(process.env.EMAIL_BACKEND!, {
      type,
      id,
      userId,
      otherInfo,
    });
  } catch (error) {
    console.error(`failed to send email for ${type} with ID ${id}: ${error}`);
    throw error;
  }
}
