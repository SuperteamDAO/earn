import { PROJECT_NAME } from '@/constants/project';

export function tweetTemplate(url: string) {
  return `The results of this latest @${PROJECT_NAME} listing are out. Congratulations to the winners👏

${url}
`;
}
