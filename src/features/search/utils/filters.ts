import { type CheckboxFilter } from '../types';

export const preStatusFilters: CheckboxFilter[] = [
  {
    label: '正在进行',
    value: 'OPEN',
    checked: false,
  },
  {
    label: '审核中',
    value: 'REVIEW',
    checked: false,
  },
  {
    label: '已完成',
    value: 'CLOSED',
    checked: false,
  },
];

export const preSkillFilters: CheckboxFilter[] = [
  {
    label: '内容',
    value: 'CONTENT',
    checked: false,
  },
  {
    label: '设计',
    value: 'DESIGN',
    checked: false,
  },
  {
    label: '开发',
    value: 'DEVELOPMENT',
    checked: false,
  },
  {
    label: '其他',
    value: 'OTHER',
    checked: false,
  },
];
