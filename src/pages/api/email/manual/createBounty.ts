import type { NextApiRequest, NextApiResponse } from 'next';

import { NewBountyTemplate } from '@/components/emails/newBountyTemplate';
import type { Skills } from '@/interface/skills';
import { prisma } from '@/prisma';
import { getUnsubEmails } from '@/utils/airtable';
import { rateLimitedPromiseAll } from '@/utils/rateLimitedPromises';
import resendMail from '@/utils/resend';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.body;
  try {
    const unsubscribedEmails = await getUnsubEmails();
    const listing = await prisma.bounties.findUnique({
      where: {
        id,
      },
    });

    if (!listing) {
      return res.status(400).json({ error: 'Listing not found.' });
    }

    const skills = listing.skills as Skills;

    const users = (
      await prisma.user.findMany({
        where: {
          isTalentFilled: true,
        },
      })
    ).filter((user) => {
      if (!user.notifications || unsubscribedEmails.includes(user.email))
        return false;

      const userNotifications =
        typeof user.notifications === 'string'
          ? JSON.parse(user.notifications)
          : user.notifications;

      return userNotifications.some((notification: { label: string }) =>
        skills.some((skill) => skill.skills === notification.label)
      );
    });

    const email: {
      email: string;
      name: string;
    }[] = users.map((user) => {
      return {
        email: user.email,
        name: user.firstName as string,
      };
    });

    const emailsSent: string[] = [];

    await rateLimitedPromiseAll(email, 9, async (e) => {
      if (emailsSent.includes(e.email)) {
        return;
      }

      await resendMail.emails.send({
        from: `Kash from Superteam <${process.env.RESEND_EMAIL}>`,
        to: [e.email],
        subject: 'Here’s a New Listing You’d Be Interested In..',
        react: NewBountyTemplate({
          name: e.name,
          link: `https://earn.superteam.fun/listings/bounties/${listing.slug}/?utm_source=superteamearn&utm_medium=email&utm_campaign=notifications`,
        }),
      });

      emailsSent.push(e.email);
    });

    return res.status(200).json({ message: 'Ok' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
