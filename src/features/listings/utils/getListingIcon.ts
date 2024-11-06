export const getListingIcon = (type: string) => {
  switch (type) {
    case 'bounty':
      return '/assets/icons/bolt.svg';
    case 'project':
      return '/assets/icons/briefcase.svg';
    case 'hackathon':
      return '/assets/icons/laptop.svg';
    case 'grant':
      return '/assets/icons/bank.svg';
    default:
      return '/assets/icons/bolt.svg';
  }
};
