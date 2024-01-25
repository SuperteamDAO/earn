import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  // const { id } = req.body;
  try {
    // const unsubscribedEmails = await getUnsubEmails();
    // const submission = await prisma.submission.findUnique({
    //   where: {
    //     id,
    //   },
    //   include: {
    //     user: true,
    //     listing: true,
    //   },
    // });

    // if (
    //   submission &&
    //   !unsubscribedEmails.includes(submission.user.email as string)
    // ) {
    //   await resendMail.emails.send({
    //     from: `Kash from Superteam <${process.env.RESEND_EMAIL}>`,
    //     to: [submission?.user.email as string],
    //     subject: 'People Love Your Superteam Earn Submission!',
    //     react: SubmissionLikeTemplate({
    //       name: submission?.user.firstName as string,
    //       bountyName: submission?.listing.title as string,
    //       link: `https://earn.superteam.fun/listings/bounties/${submission?.listing.slug}/submission/?utm_source=superteamearn&utm_medium=email&utm_campaign=notifications`,
    //     }),
    //   });
    // }

    return res.status(200).json({ message: 'Ok' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
