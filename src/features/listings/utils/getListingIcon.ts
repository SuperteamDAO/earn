export const getListingIcon = (type: string) => {
  switch (type) {
    case 'bounty':
      return '/assets/bounty-icon.svg';
    case 'project':
      return '/assets/project-icon.svg';
    case 'hackathon':
      return '/assets/hackathon-icon.svg';
    case 'grant':
      return '/assets/grant-icon.svg';
    default:
      return '/assets/bounty-icon.svg';
  }
};
