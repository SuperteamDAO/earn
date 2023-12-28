type MainSkills =
  | 'Frontend'
  | 'Backend'
  | 'Blockchain'
  | 'Design'
  | 'Growth'
  | 'Content'
  | 'Community'
  | 'Other'
  | 'Mobile';

type SubSkillsType =
  | 'Javascript'
  | 'PHP'
  | 'Python'
  | 'Java'
  | 'C++'
  | 'C'
  | 'Ruby'
  | 'Go'
  | 'MySQL'
  | 'Postgres'
  | 'Redux'
  | 'MongoDB'
  | 'React'
  | 'Angular'
  | 'Android'
  | 'Vue'
  | 'iOS'
  | 'Rust'
  | 'Solidity'
  | 'Sway'
  | 'Move'
  | 'Flutter'
  | 'React Native'
  | 'Data Analytics'
  | 'Operations'
  | 'Admin'
  | 'Community Manager'
  | 'Discord Moderator'
  | 'Research'
  | 'Writing'
  | 'Video'
  | 'Social Media'
  | 'Business Development'
  | 'Digital Marketing'
  | 'Marketing'
  | 'UI/UX Design'
  | 'Graphic Design'
  | 'Illustration'
  | 'Game Design'
  | 'Presentation Design'
  | 'CPP';

type Skills = {
  skills: MainSkills;
  subskills: SubSkillsType[];
}[];

type SkillMap = {
  mainskill: MainSkills;
  color: string;
};

export type { MainSkills, SkillMap, Skills, SubSkillsType };

export const SkillList: {
  mainskill: MainSkills;
  subskills: SubSkillsType[];
  variations: string[];
}[] = [
  {
    mainskill: 'Frontend',
    subskills: ['React', 'Angular', 'Vue', 'Redux'],
    variations: ['Frontend', 'Front-End Dev', 'FrontEnd Dev', 'Frontend Dev'],
  },
  {
    mainskill: 'Backend',
    subskills: [
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
    variations: ['Backend', 'Back-End Dev', 'BackEnd Dev', 'Backend Dev'],
  },
  {
    mainskill: 'Design',
    subskills: [
      'UI/UX Design',
      'Graphic Design',
      'Illustration',
      'Game Design',
      'Presentation Design',
    ],
    variations: ['Desgin'],
  },
  {
    mainskill: 'Mobile',
    subskills: ['Android', 'iOS', 'Flutter', 'React Native'],
    variations: ['Mobile Engineer', 'Mobile Dev', 'Mobile Developer'],
  },
  {
    mainskill: 'Blockchain',
    subskills: ['Rust', 'Solidity', 'Sway', 'Move'],
    variations: ['Blockchain', 'Blockchain Dev', 'Blockchain Developer'],
  },
  {
    mainskill: 'Content',
    subskills: ['Research', 'Writing', 'Video', 'Social Media'],
    variations: ['Content', 'Content Creation'],
  },
  {
    mainskill: 'Growth',
    subskills: ['Business Development', 'Digital Marketing', 'Marketing'],
    variations: ['Growth'],
  },
  {
    mainskill: 'Community',
    subskills: ['Community Manager', 'Discord Moderator'],
    variations: ['Community'],
  },
  {
    mainskill: 'Other',
    subskills: ['Data Analytics', 'Operations', 'Admin'],
    variations: ['other', 'Other'],
  },
];
