// How a profile words someone's work preference (Earn's older, wordier
// values included); null when they aren't looking.
export const getWorkPreferenceText = (
  workPrefernce?: string | null,
): string | null => {
  if (!workPrefernce || workPrefernce === 'Not looking for Work') {
    return null;
  }
  const fullTimePatterns = [
    'Passively looking for fulltime positions',
    'Actively looking for fulltime positions',
    'Fulltime',
  ];
  const freelancePatterns = [
    'Passively looking for freelance work',
    'Actively looking for freelance work',
    'Freelance',
  ];
  const internshipPatterns = ['Actively looking for internships', 'Internship'];

  if (fullTimePatterns.includes(workPrefernce)) {
    return 'Fulltime Roles';
  }
  if (freelancePatterns.includes(workPrefernce)) {
    return 'Freelance Opportunities';
  }
  if (internshipPatterns.includes(workPrefernce)) {
    return 'Internship Opportunities';
  }

  return workPrefernce;
};
