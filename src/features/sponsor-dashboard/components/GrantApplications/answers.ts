// An application's answers to the grant's questions, as stored.
export interface ApplicationAnswer {
  readonly question?: string;
  readonly answer?: string;
  readonly type?: string;
  readonly optional?: boolean;
}

const textOf = (value: unknown) =>
  typeof value === 'string' ? value : undefined;

export const answersOf = (value: unknown): ApplicationAnswer[] =>
  Array.isArray(value)
    ? value.flatMap((entry: unknown) =>
        typeof entry === 'object' && entry !== null
          ? [
              {
                question:
                  'question' in entry ? textOf(entry.question) : undefined,
                answer: 'answer' in entry ? textOf(entry.answer) : undefined,
                type: 'type' in entry ? textOf(entry.type) : undefined,
                optional:
                  'optional' in entry && typeof entry.optional === 'boolean'
                    ? entry.optional
                    : undefined,
              },
            ]
          : [],
      )
    : [];

// A JSON column holding a list of links (uploaded files), or null.
export const stringsOf = (value: unknown): string[] | null =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : null;

// A grant's recorded payments (paymentDetails).
export interface GrantPaymentDetail {
  tranche: number;
  amount: number;
  txId?: string;
}

export const paymentsOf = (value: unknown): GrantPaymentDetail[] =>
  Array.isArray(value)
    ? value.flatMap((entry: unknown) =>
        typeof entry === 'object' &&
        entry !== null &&
        'tranche' in entry &&
        typeof entry.tranche === 'number' &&
        'amount' in entry &&
        typeof entry.amount === 'number'
          ? [
              {
                tranche: entry.tranche,
                amount: entry.amount,
                txId:
                  'txId' in entry && typeof entry.txId === 'string'
                    ? entry.txId
                    : undefined,
              },
            ]
          : [],
      )
    : [];
