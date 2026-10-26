import * as Schema from 'effect/Schema';

// What the submission form posts (Earn's create and update bodies).
export const SubmissionBody = Schema.Struct({
  listingId: Schema.String,
  link: Schema.optional(Schema.String),
  tweet: Schema.optional(Schema.String),
  otherInfo: Schema.optional(Schema.String),
  eligibilityAnswers: Schema.optional(
    Schema.Array(
      Schema.Struct({ question: Schema.String, answer: Schema.String }),
    ),
  ),
});
