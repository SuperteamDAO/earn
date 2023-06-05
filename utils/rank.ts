const defaultRanks = [
  'first',
  'second',
  'third',
  'forth',
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

// first, third, second

export const sortRank = (rankArray: string[]) => {
  return rankArray
    .map((rank) => ({
      rank,
      index: defaultRanks.indexOf(rank),
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
