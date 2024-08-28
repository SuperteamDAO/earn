import { BONUS_REWARD_POSITION } from '@/constants';
import { type Rewards } from '@/features/listings';

const rankLabels = [
  'zeroth',
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
  'sixth',
  'seventh',
  'eighth',
  'ninth',
  'tenth',
  'eleventh',
  'twelfth',
  'thirteenth',
  'fourteenth',
  'fifteenth',
  'sixteenth',
  'seventeenth',
  'eighteenth',
  'nineteenth',
  'twentieth',
  'twentyFirst',
  'twentySecond',
  'twentyThird',
  'twentyFourth',
  'twentyFifth',
  'twentySixth',
  'twentySeventh',
  'twentyEighth',
  'twentyNinth',
  'thirtieth',
  'thirtyFirst',
  'thirtySecond',
  'thirtyThird',
  'thirtyFourth',
  'thirtyFifth',
  'thirtySixth',
  'thirtySeventh',
  'thirtyEighth',
  'thirtyNinth',
  'fortieth',
  'fortyFirst',
  'fortySecond',
  'fortyThird',
  'fortyFourth',
  'fortyFifth',
  'fortySixth',
  'fortySeventh',
  'fortyEighth',
  'fortyNinth',
  'fiftieth',
];

export const getRankLabels = (rank: number) => {
  if (rank === 99) return 'bonus';
  else return rankLabels[rank];
};

export const cleanRewards = (rewards?: Rewards, skipBonus = false) =>
  Object.keys(rewards || [])
    .filter((key) => key !== null && key !== undefined)
    .map(Number)
    .filter((key) => !isNaN(key))
    .filter((key) => (skipBonus ? key !== BONUS_REWARD_POSITION : true));

export const cleanRewardPrizes = (rewards?: Rewards, skipBonus = false) => {
  const nRewards = { ...rewards };
  if (skipBonus && nRewards) {
    delete nRewards[99];
  }
  return Object.values(nRewards || [])
    .filter((key) => key !== null && key !== undefined)
    .map(Number)
    .filter((key) => !isNaN(key));
};

export const nthLabelGenerator = (key: number) => {
  if (key === 1) return '1st';
  if (key === 2) return '2nd';
  if (key === 3) return '3rd';
  if (key === BONUS_REWARD_POSITION) return 'bonus';
  return `${key}th`;
};

export const sortRank = (rankArray: number[]) => {
  return rankArray
    .map((rank) => ({
      rank,
      index: rank,
    }))
    .sort((a, b) => {
      if (a.index < b.index) {
        return -1;
      }
      if (a.index > b.index) {
        return 1;
      }
      return 0;
    })
    .map((item) => item.rank);
};
