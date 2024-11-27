import { prisma } from '@/prisma';

export const colorMap = {
  Spam: { bg: 'red.100', color: 'red.600' },
  Reviewed: { bg: 'blue.100', color: 'blue.600' },
  Unreviewed: { bg: 'orange.100', color: 'orange.800' },
  Shortlisted: { bg: 'purple.100', color: 'purple.600' },
  winner: { bg: 'green.100', color: 'green.800' },
  Approved: { bg: 'green.100', color: 'green.800' },
  Rejected: { bg: 'red.100', color: 'red.600' },
  Pending: { bg: 'orange.100', color: 'orange.800' },
  Winner: { bg: 'green.100', color: 'green.800' },
  Completed: { bg: 'blue.100', color: 'blue.600' },
};

export const talentMapCN = {
  Spam: '无效',
  Reviewed: '已审核',
  Unreviewed: '未审核',
  Shortlisted: '候选人',
  winner: '获胜者',
  Approved: '同意',
  Reject: '拒绝',
  Pending: '待定',
  Winner: '获胜者',
  Completed: '已完成',
};

export async function createSponsorEmailSettings(userId: string) {
  const categories = new Set([
    'commentSponsor',
    'deadlineSponsor',
    'productAndNewsletter',
    'replyOrTagComment',
  ]);

  for (const category of categories) {
    await prisma.emailSettings.create({
      data: {
        user: { connect: { id: userId } },
        category,
      },
    });
  }
}
