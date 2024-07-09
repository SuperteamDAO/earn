export const colorMap = {
  Spam: { bg: 'red.100', color: 'red.600' },
  Reviewed: { bg: 'blue.100', color: 'blue.600' },
  Unreviewed: { bg: 'orange.100', color: 'orange.800' },
  Shortlisted: { bg: 'purple.100', color: 'purple.600' },
  winner: { bg: 'green.100', color: 'green.800' },
  Approved: { bg: 'green.100', color: 'green.800' },
  Rejected: { bg: 'red.100', color: 'red.600' },
  Pending: { bg: 'orange.100', color: 'orange.800' },
};

export const isLink = (text: string) => {
  const urlRegex =
    /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+([\/\w \.-]*)*\/?$/;
  return urlRegex.test(text);
};
