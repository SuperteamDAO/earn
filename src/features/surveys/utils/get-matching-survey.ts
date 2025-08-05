import { type Survey } from 'posthog-js';

export function getMatchingSurvey(
  surveys: Survey[],
  key: string,
): Survey | null {
  const survey = surveys.find(
    (survey) => survey.id === key || survey.name === key,
  );
  return survey || null;
}
