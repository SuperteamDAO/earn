import { type ScoutRowType } from '../types';

export const colorMap = {
  Spam: { bg: 'red.100', color: 'red.600' },
  Reviewed: { bg: 'blue.100', color: 'blue.600' },
  Unreviewed: { bg: 'orange.100', color: 'orange.800' },
  Shortlisted: { bg: 'purple.100', color: 'purple.600' },
  winner: { bg: 'green.100', color: 'green.800' },
};

export const dummyScountData: ScoutRowType[] = [
  {
    id: 'aofee',
    name: 'Jane Cooper',
    username: 'janecooper',
    dollarsEarned: 15329,
    score: 9.1,
    skills: ['Python', 'Javascript', 'Typescript', 'React', 'Next.js'],
    pfp: 'https://res.cloudinary.com/dgvnuwspr/image/upload/earn-pfps/uzgmshxfx3ltzt2mhlqu.jpg',
    recommended: true,
    invited: false,
  },
  {
    id: 'aofee',
    name: 'Jacob Jones',
    username: 'jacobjones',
    dollarsEarned: 12329,
    score: 7.7,
    skills: ['Node.js', 'Express', 'MongoDB', 'Mongoose'],
    pfp: 'https://res.cloudinary.com/dgvnuwspr/image/upload/v1683134513/People%20DPs/rec8RdEQmDwtdMFzs.jpg',
    recommended: true,
    invited: true,
  },
  {
    id: 'aofee',
    name: 'Kathryn Murphy',
    username: 'kmpurhy94',
    dollarsEarned: 9549,
    score: 5.3,
    skills: ['HTML', 'CSS', 'Javascript', 'React'],
    pfp: 'https://res.cloudinary.com/dgvnuwspr/image/upload/v1683135312/People%20DPs/rec6m0WFx1ovdkPd1.jpg',
    recommended: false,
    invited: false,
  },
];
