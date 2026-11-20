export interface QuestionConfig {
  order: number;
  question: string;
  optional: boolean;
  isLink: boolean;
  type?: 'text' | 'link';
}

// Listing `eligibility` and grant `questions` are JSON columns. Entries map
// one-to-one (never filtered) because validation pairs each question with its
// answer by index.
export function parseQuestionConfigs(
  value: unknown,
): QuestionConfig[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map((entry: unknown, index): QuestionConfig => {
    const item: Record<string, unknown> =
      typeof entry === 'object' && entry !== null ? { ...entry } : {};
    return {
      order: typeof item.order === 'number' ? item.order : index,
      question: typeof item.question === 'string' ? item.question : '',
      optional: Boolean(item.optional),
      isLink: Boolean(item.isLink),
      type:
        item.type === 'link'
          ? 'link'
          : item.type === 'text'
            ? 'text'
            : undefined,
    };
  });
}
