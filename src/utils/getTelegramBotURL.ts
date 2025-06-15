import { type User } from '@/interface/user';

export const getTelegramBotURL = (user: User | null) => {
  if (!user || !user.location) {
    return `https://t.me/superteam_earn_notifications_bot?start=${btoa('location=global')}`;
  }
  const data = btoa(`location=${user.location}`);
  return `https://t.me/superteam_earn_notifications_bot?start=${data}`;
};
