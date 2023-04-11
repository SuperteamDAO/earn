export type Listingtype = 'Bounties' | 'Jobs' | 'Grants';

export type JobType = 'parttime' | 'fulltime' | 'intership';

export type Source = 'native' | 'manual';

export type Prize = 'first' | 'second' | 'third' | 'forth' | 'fifth';
export const PrizeLabels: string[] = [
  'first',
  'second',
  'third',
  'forth',
  'fifth',
];
export type SponsorStatus = 'Unassigned' | 'Assigned';

export type SponsorTypes = 'Admin' | 'Member';

export type BountyStatus =
  | 'created'
  | 'funded'
  | 'ongoing'
  | 'close'
  | 'winner';

export type Skill =
  | 'Front-End Dev'
  | 'Back-End Dev'
  | 'Blockchain Dev'
  | 'Fullstack Dev'
  | 'Mobile Engineer'
  | 'Design'
  | 'Community'
  | 'Growth'
  | 'Content'
  | 'Other';

export const SkillList: Skill[] = [
  'Back-End Dev',
  'Blockchain Dev',
  'Front-End Dev',
  'Fullstack Dev',
  'Mobile Engineer',
  'Design',
  'Growth',
  'Community',
  'Content',
  'Other',
];
export const TalentSkillMap: { [key in Skill]: string[] } = {
  'Front-End Dev': ['React', 'Angular', 'Vue', 'Redux'],
  'Blockchain Dev': ['Rust', 'Solidity', 'Sway', 'Move'],
  'Back-End Dev': [
    'Javascript',
    'PHP',
    'Python',
    'Java',
    'C++',
    'C',
    'Ruby',
    'Go',
    'MySQL',
    'Postgres',
    'MongoDB',
  ],
  Design: [
    'UI/UX Design',
    'Graphic Design',
    'Illustration',
    'Game Design',
    'Presentation Design',
  ],
  Growth: ['Business Development', 'Digital Marketing', 'Marketing'],
  Content: ['Research', 'Writing', 'Video', 'Social Media'],
  Community: ['Community Manager', 'Discord Moderator'],
  Other: ['Data Analytics', 'Operations', 'Admin'],
  'Mobile Engineer': ['Android', 'iOS', 'Flutter', 'React Native'],
  'Fullstack Dev': [
    'Javascript',
    'PHP',
    'Python',
    'Java',
    'C++',
    'C',
    'Ruby',
    'Go',
    'MySQL',
    'Postgres',
    'MongoDB',
    'React',
    'Angular',
    'Vue',
  ],
};
