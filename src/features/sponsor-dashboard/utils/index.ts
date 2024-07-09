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
  const linkRegex =
    /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/i;

  return linkRegex.test(text);
};
