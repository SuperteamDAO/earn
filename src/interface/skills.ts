import { type MultiSelectOptions } from '@/constants';

const skillSubSkillMap = {
  Frontend: [
    { label: 'React', value: 'React' },
    { label: 'Svelte', value: 'Svelte' },
    { label: 'Angular', value: 'Angular' },
    { label: 'Vue', value: 'Vue' },
    { label: 'SolidJS', value: 'SolidJS' },
    { label: 'Redux', value: 'Redux' },
    { label: 'Elm', value: 'Elm' },
    { label: 'Other', value: 'Other' },
  ],
  Backend: [
    { label: 'Javascript', value: 'Javascript' },
    { label: 'Typescript', value: 'Typescript' },
    { label: 'Node.js', value: 'Node.js' },
    { label: 'PHP', value: 'PHP' },
    { label: 'Laravel', value: 'Laravel' },
    { label: 'Python', value: 'Python' },
    { label: 'Django', value: 'Django' },
    { label: 'Kotlin', value: 'Kotlin' },
    { label: 'Swift', value: 'Swift' },
    { label: 'Java', value: 'Java' },
    { label: 'C++', value: 'C++' },
    { label: 'C', value: 'C' },
    { label: 'Ruby', value: 'Ruby' },
    { label: 'Ruby on Rails', value: 'Ruby on Rails' },
    { label: 'Go', value: 'Go' },
    { label: 'MySQL', value: 'MySQL' },
    { label: 'Postgres', value: 'Postgres' },
    { label: 'MongoDB', value: 'MongoDB' },
    { label: 'Pearl', value: 'Pearl' },
    { label: 'Scala', value: 'Scala' },
    { label: 'Elixir', value: 'Elixir' },
    { label: 'Haskell', value: 'Haskell' },
    { label: 'Erlang', value: 'Erlang' },
    { label: 'Deno', value: 'Deno' },
    { label: 'Dart', value: 'Dart' },
    { label: 'ASP.NET', value: 'ASP.NET' },
    { label: 'Other', value: 'Other' },
  ],
  Blockchain: [
    { label: 'Rust', value: 'Rust' },
    { label: 'Solidity', value: 'Solidity' },
    { label: 'Move', value: 'Move' },
    { label: 'Other', value: 'Other' },
  ],
  Mobile: [
    { label: 'Android', value: 'Android' },
    { label: 'iOS', value: 'iOS' },
    { label: 'Flutter', value: 'Flutter' },
    { label: 'React Native', value: 'React Native' },
    { label: 'Other', value: 'Other' },
  ],
  Design: [
    { label: 'UI/UX Design', value: 'UI/UX Design' },
    { label: 'Graphic Design', value: 'Graphic Design' },
    { label: 'Illustration', value: 'Illustration' },
    { label: 'Game Design', value: 'Game Design' },
    { label: 'Presentation Design', value: 'Presentation Design' },
    { label: 'Other', value: 'Other' },
  ],
  Community: [
    { label: 'Community Manager', value: 'Community Manager' },
    { label: 'Discord Moderator', value: 'Discord Moderator' },
    { label: 'Other', value: 'Other' },
  ],
  Growth: [
    { label: 'Business Development', value: 'Business Development' },
    { label: 'Digital Marketing', value: 'Digital Marketing' },
    { label: 'Marketing', value: 'Marketing' },
    { label: 'Other', value: 'Other' },
  ],
  Content: [
    { label: 'Research', value: 'Research' },
    { label: 'Photography', value: 'Photography' },
    { label: 'Video', value: 'Video' },
    { label: 'Video Editing', value: 'Video Editing' },
    { label: 'Writing', value: 'Writing' },
    { label: 'Social Media', value: 'Social Media' },
    { label: 'Other', value: 'Other' },
  ],
  Other: [
    { label: 'Data Analytics', value: 'Data Analytics' },
    { label: 'Operations', value: 'Operations' },
    { label: 'Product Feedback', value: 'Product Feedback' },
    { label: 'Product Manager', value: 'Product Manager' },
  ],
} as const;

const MainSkills: MultiSelectOptions[] = Object.keys(skillSubSkillMap).map(
  (skill) => ({
    label: skill,
    value: skill,
  }),
);

type ParentSkills = keyof typeof skillSubSkillMap;
type SubSkillsType = (typeof skillSubSkillMap)[ParentSkills][number]['value'];

type Skills = {
  skills: ParentSkills;
  subskills: SubSkillsType[];
}[];

type SkillMap = {
  mainskill: ParentSkills;
  color: string;
};

export type { ParentSkills, SkillMap, Skills, SubSkillsType };
export { MainSkills, skillSubSkillMap };
