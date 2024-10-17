import { t } from 'i18next';

export function formatFromNow(now: string) {
  return now
    .replace('a few seconds', '1' + t('commentUtils.timeUnits.second'))
    .replace('a minute', '1' + t('commentUtils.timeUnits.minute'))
    .replace(' minutes', t('commentUtils.timeUnits.minute'))
    .replace('an hour', '1' + t('commentUtils.timeUnits.hour'))
    .replace(' hours', t('commentUtils.timeUnits.hour'))
    .replace('a day', '1' + t('commentUtils.timeUnits.day'))
    .replace(' days', t('commentUtils.timeUnits.day'))
    .replace('a month', '1' + t('commentUtils.timeUnits.month'))
    .replace(' months', t('commentUtils.timeUnits.month'))
    .replace('a year', '1' + t('commentUtils.timeUnits.year'))
    .replace(' years', t('commentUtils.timeUnits.year'));
}

export function randomSubmissionCommentGenerator(type: string | undefined) {
  const min = Math.ceil(1);
  const max = Math.floor(6);
  const random = Math.floor(Math.random() * (max - min + 1)) + min;

  const commentKey = `commentUtils.submissionComments.${type || 'default'}`;

  switch (random) {
    case 1:
      return t(`${commentKey}.justSubmitted`);
    case 2:
      return t(`${commentKey}.inTheArena`);
    case 3:
      return t(`${commentKey}.potentialWinner`);
    case 4:
      return t(`${commentKey}.steppingUp`);
    case 5:
      return t(`${commentKey}.isIn`);
    case 6:
      return t(`${commentKey}.onTheMove`);
    default:
      return t('commentUtils.submissionComments.default');
  }
}
