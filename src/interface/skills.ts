import { type MultiSelectOptions } from '@/constants';

const titlesForCN = {
  Design: '设计',
  Content: '内容',
  Development: '开发',
  Other: '其他',
};

const skillSubSkillMap = {
  Frontend: [
    { label: 'React', value: 'React' },
    { label: 'Svelte', value: 'Svelte' },
    { label: 'Angular', value: 'Angular' },
    { label: 'Vue', value: 'Vue' },
    { label: 'SolidJS', value: 'SolidJS' },
    { label: 'Redux', value: 'Redux' },
    { label: 'Elm', value: 'Elm' },
    { label: '其他', value: 'Other' },
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
    { label: 'Perl', value: 'Perl' },
    { label: 'Scala', value: 'Scala' },
    { label: 'Elixir', value: 'Elixir' },
    { label: 'Haskell', value: 'Haskell' },
    { label: 'Erlang', value: 'Erlang' },
    { label: 'Deno', value: 'Deno' },
    { label: 'Dart', value: 'Dart' },
    { label: 'ASP.NET', value: 'ASP.NET' },
    { label: '其他', value: 'Other' },
  ],
  Blockchain: [
    { label: 'Rust', value: 'Rust' },
    { label: 'Solidity', value: 'Solidity' },
    { label: 'Move', value: 'Move' },
    { label: '其他', value: 'Other' },
  ],
  Mobile: [
    { label: 'Android', value: 'Android' },
    { label: 'iOS', value: 'iOS' },
    { label: 'Flutter', value: 'Flutter' },
    { label: 'React Native', value: 'React Native' },
    { label: '其他', value: 'Other' },
  ],
  Design: [
    { label: 'UI/UX 设计', value: 'UI/UX Design' },
    { label: '平面设计', value: 'Graphic Design' },
    { label: '插图', value: 'Illustration' },
    { label: '游戏设计', value: 'Game Design' },
    { label: '演示设计', value: 'Presentation Design' },
    { label: '其他', value: 'Other' },
  ],
  Community: [
    { label: '社区经理', value: 'Community Manager' },
    { label: 'Discord 管理员', value: 'Discord Moderator' },
    { label: '其他', value: 'Other' },
  ],
  Growth: [
    { label: '商务拓展', value: 'Business Development' },
    { label: '数字营销', value: 'Digital Marketing' },
    { label: '市场营销', value: 'Marketing' },
    { label: '其他', value: 'Other' },
  ],
  Content: [
    { label: '研究', value: 'Research' },
    { label: '摄影', value: 'Photography' },
    { label: '视频', value: 'Video' },
    { label: '视频编辑', value: 'Video Editing' },
    { label: '写作', value: 'Writing' },
    { label: '社交媒体', value: 'Social Media' },
    { label: '其他', value: 'Other' },
  ],
  Other: [
    { label: '数据分析', value: 'Data Analytics' },
    { label: '运营', value: 'Operations' },
    { label: '产品反馈', value: 'Product Feedback' },
    { label: '产品经理', value: 'Product Manager' },
  ],
} as const;

const skillMapCN = {
  Frontend: '前端',
  Backend: '后端',
  Blockchain: '区块链',
  Mobile: '移动',
  Design: '设计',
  Community: '社区',
  Growth: '增长',
  Content: '内容',
  Other: '其他',
};

const MainSkills: MultiSelectOptions[] = Object.keys(skillSubSkillMap).map(
  (skill) => ({
    label: skillMapCN[skill],
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
export { MainSkills, skillMapCN, skillSubSkillMap, titlesForCN };
