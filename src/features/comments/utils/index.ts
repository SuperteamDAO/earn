export function formatFromNow(now: string) {
  return now
    .replace('a few seconds', '1s')
    .replace('a minute', '1m')
    .replace(' minutes', 'm')
    .replace('an hour', '1h')
    .replace(' hours', 'h')
    .replace('a day', '1d')
    .replace(' days', 'd')
    .replace('a month', '1M')
    .replace(' months', 'M')
    .replace('a year', '1y')
    .replace(' years', 'y');
}

export function randomSubmissionCommentGenerator(type: string | undefined) {
  const min = Math.ceil(1);
  const max = Math.floor(6);
  const random = Math.floor(Math.random() * (max - min + 1)) + min;

  switch (random) {
    case 1:
      if (type === 'bounty') return 'Just submitted to this Bounty';
      if (type === 'project') return 'Just applied to this Project';
      break;
    case 2:
      if (type === 'bounty')
        return 'Is in the arena, they just submitted to this Bounty';
      if (type === 'project')
        return 'Is in the arena, they just applied to this Project';
      break;
    case 3:
      if (type === 'bounty')
        return 'Potential Winner? They just submitted to this bounty';
      if (type === 'project')
        return 'Potential Winner? They just applied to this project';
      break;
    case 4:
      if (type === 'bounty')
        return 'Is stepping up; they just submitted to this bounty';
      if (type === 'project')
        return 'Is stepping up; they just applied to this project';
      break;
    case 5:
      if (type === 'bounty') return 'Is in! They just submitted to this bounty';
      if (type === 'project') return 'Is in! They just applied to this project';
      break;
    case 6:
      if (type === 'bounty')
        return 'Is on the move! They just submitted to this bounty';
      if (type === 'project')
        return 'Is on the move! They just applied to this project';
      break;
    default:
      break;
  }
  return 'Just submitted to this listing';
}
