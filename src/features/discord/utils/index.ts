export * from './deadlineReached';
export * from './dueForWinners';
export * from './listingUpdates';
export * from './winnersAnnouncement';

export const creatPOCLink = (link: string) => {
  if (link.startsWith('https://')) return link;
  else return `https://${link}`;
};
