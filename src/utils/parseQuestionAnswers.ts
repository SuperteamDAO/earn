export interface QuestionAnswer {
  question: string;
  answer: string;
  optional?: boolean;
  type?: 'text' | 'link';
}

function isQuestionAnswer(item: unknown): item is QuestionAnswer {
  return (
    typeof item === 'object' &&
    item !== null &&
    'question' in item &&
    typeof item.question === 'string' &&
    'answer' in item &&
    typeof item.answer === 'string'
  );
}

// `answers` and `eligibilityAnswers` are JSON columns, so Prisma types them as
// JsonValue; this drops entries that do not have the shape the forms write.
export function parseQuestionAnswers(value: unknown): QuestionAnswer[] {
  return Array.isArray(value) ? value.filter(isQuestionAnswer) : [];
}
