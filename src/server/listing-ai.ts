import 'server-only';

import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import {
  convertToModelMessages,
  generateObject,
  streamText,
  type UIMessage,
} from 'ai';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import { z } from 'zod';

import { type Skills, skillsArraySchema } from '@/interface/skills';
import { CompensationType } from '@/prisma/enums';
import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';
import * as RateLimits from '@/server/rate-limits';
import * as Tokens from '@/server/tokens';

import {
  MAX_BONUS_SPOTS,
  MAX_REWARD,
} from '@/features/listing-builder/constants';
import {
  eligibilityQuestionSchema,
  type TEligibilityQuestion,
} from '@/features/listing-builder/types/schema';
import { getDescriptionPrompt } from '@/features/listing-builder/utils/prompts/description';
import { generateListingQuestionsPrompt } from '@/features/listing-builder/utils/prompts/questions';
import { generateListingRewardsPrompt } from '@/features/listing-builder/utils/prompts/rewards';
import { generateListingSkillsPrompt } from '@/features/listing-builder/utils/prompts/skills';
import { generateListingTitlePrompt } from '@/features/listing-builder/utils/prompts/title';
import { generateListingTokenPrompt } from '@/features/listing-builder/utils/prompts/token';

export class AiFailed extends Schema.TaggedError<AiFailed>()('AiFailed', {
  cause: Schema.optional(Schema.Defect()),
}) {
  override get message() {
    return 'AI generation failed';
  }
}

type ListingType = 'bounty' | 'hackathon';

export interface DescriptionRequest {
  readonly messages: ReadonlyArray<UIMessage>;
  readonly listingType: ListingType;
  readonly token?: string;
  readonly tokenUsdAmount?: number;
  readonly hackathonName?: string;
}

export interface RewardsRequest {
  readonly description: string;
  readonly type: ListingType;
  readonly token: string;
  readonly tokenUsdValue: number;
}

export interface GeneratedRewards {
  readonly compensationType: CompensationType;
  readonly maxBonusSpots?: number | null;
  readonly minRewardAsk: number;
  readonly maxRewardAsk: number;
  readonly rewards: Record<string, number>;
}

// The listing builder's "Generate with AI": OpenRouter models, as Earn
// calls them, each request counted against the sponsor member's
// `aiGenerate` limit.
export class ListingAi extends Context.Service<
  ListingAi,
  {
    // Streams the description (the AI SDK's UI message stream).
    readonly description: (
      userId: string,
      sponsorId: string,
      request: DescriptionRequest,
    ) => Effect.Effect<
      Response,
      RateLimits.RateLimited | AiFailed | Database.DatabaseError
    >;
    readonly title: (
      userId: string,
      description: string,
      type: ListingType,
    ) => Effect.Effect<{ readonly title: string }, RateLimits.RateLimited>;
    readonly questions: (
      userId: string,
      description: string,
      type: ListingType,
    ) => Effect.Effect<
      ReadonlyArray<Omit<TEligibilityQuestion, 'optional'>>,
      RateLimits.RateLimited | AiFailed
    >;
    readonly rewards: (
      userId: string,
      request: RewardsRequest,
    ) => Effect.Effect<
      GeneratedRewards,
      RateLimits.RateLimited | AiFailed | Database.DatabaseError
    >;
    readonly skills: (
      userId: string,
      description: string,
    ) => Effect.Effect<Skills, RateLimits.RateLimited>;
    readonly token: (
      userId: string,
      description: string,
    ) => Effect.Effect<
      { readonly token?: string | null },
      RateLimits.RateLimited | Database.DatabaseError
    >;
  }
>()('earn/ListingAi') {}

const TIMEOUT_MS = 15_000;

const titleSchema = z.object({ title: z.string().min(1).max(100) });
const skillsSchema = z.object({ skills: skillsArraySchema });
const tokenSchema = z.object({ token: z.string().optional().nullable() });
const questionsSchema = z.object({
  eligibilityQuestions: z.array(
    eligibilityQuestionSchema.omit({ optional: true }),
  ),
});
const rewardsSchema = z.object({
  compensationType: z.nativeEnum(CompensationType).default('fixed'),
  maxBonusSpots: z.coerce
    .number()
    .min(0)
    .max(MAX_BONUS_SPOTS)
    .optional()
    .nullable(),
  minRewardAsk: z.coerce.number().min(0).max(MAX_REWARD),
  maxRewardAsk: z.coerce.number().min(0).max(MAX_REWARD),
  rewards: z
    .array(
      z.object({
        rank: z.string().describe(`The rank (e.g., '1' for 1st place)`),
        amount: z.coerce
          .number()
          .min(0.01)
          .max(MAX_REWARD)
          .describe('The reward amount for this rank'),
      }),
    )
    .describe(
      'An array of reward objects, each specifying a rank and amount. Empty if no ranked rewards.',
    ),
});

// A model's structured answer, or the next model's, or the fallback.
const firstOf = <A>(
  attempts: ReadonlyArray<() => Promise<A>>,
  fallback: () => A,
) =>
  Effect.promise(async () => {
    for (const attempt of attempts) {
      try {
        return await attempt();
      } catch {
        // The next model, as Earn's routes retried.
      }
    }
    return fallback();
  });

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const limits = yield* RateLimits.RateLimits;
  const database = yield* Database.Database;
  const tokens = yield* Tokens.Tokens;
  const key = config.openRouterApiKey;
  const openrouter = createOpenRouter({
    apiKey: key ? Redacted.value(key) : undefined,
  });

  const limited = (userId: string) => limits.check('aiGenerate', userId);

  const object = <S extends z.ZodTypeAny>(
    model: string,
    schema: S,
    system: string,
    prompt: string,
    options?: { readonly timeout?: boolean; readonly baseten?: boolean },
  ) =>
    generateObject({
      model: options?.baseten
        ? openrouter(model, {
            provider: { only: ['baseten'], allow_fallbacks: true },
          })
        : openrouter(model),
      system,
      prompt,
      schema,
      ...(options?.timeout === false
        ? {}
        : { abortSignal: AbortSignal.timeout(TIMEOUT_MS) }),
    }).then((result): z.infer<S> => result.object);

  const description = Effect.fn('ListingAi.description')(function* (
    userId: string,
    sponsorId: string,
    request: DescriptionRequest,
  ) {
    yield* limited(userId);
    // About the sponsor, from Earn, never from the request.
    const sponsor = yield* database.query('aiSponsor', (client) =>
      client.sponsors.findUnique({
        where: { id: sponsorId },
        select: {
          name: true,
          url: true,
          industry: true,
          twitter: true,
          bio: true,
        },
      }),
    );
    const company = sponsor
      ? `
    name: ${sponsor.name}
    url: ${sponsor.url}
    industry: ${sponsor.industry}
    twitter: ${sponsor.twitter}
    bio: ${sponsor.bio}
  `
      : 'unknown sponsor';
    const token = yield* tokens.bySymbol(request.token, {
      includeInactive: true,
    });
    const system = getDescriptionPrompt(request.listingType, {
      company,
      token: request.token,
      tokenName: token?.tokenName,
      tokenUsdAmount: request.tokenUsdAmount,
      hackathonName: request.hackathonName,
    });
    return yield* Effect.try({
      try: () =>
        streamText({
          model: openrouter('google/gemini-2.5-flash', {
            extraBody: { plugins: [{ id: 'web', max_results: 3 }] },
          }),
          system,
          messages: convertToModelMessages([...request.messages]),
          headers: {
            'HTTP-Referer': config.siteUrl,
            'X-Title': 'Superteam Earn - AI Listing Builder',
          },
        }).toUIMessageStreamResponse(),
      catch: (cause) => new AiFailed({ cause }),
    });
  });

  const title = Effect.fn('ListingAi.title')(function* (
    userId: string,
    text: string,
    type: ListingType,
  ) {
    yield* limited(userId);
    const prompt = generateListingTitlePrompt(text, type);
    const system =
      'You generate concise, compelling listing titles for provided listing description. Follow the prompt rules and strictly satisfy the response schema.';
    return yield* firstOf(
      ['google/gemini-2.5-flash', 'google/gemini-2.0-flash-lite-001'].map(
        (model) => () => object(model, titleSchema, system, prompt),
      ),
      () => ({
        title: `${type.replace(/_/g, ' ').trim()} Opportunity`.slice(0, 100),
      }),
    );
  });

  const questions = Effect.fn('ListingAi.questions')(function* (
    userId: string,
    text: string,
    type: ListingType,
  ) {
    yield* limited(userId);
    const result = yield* Effect.tryPromise({
      try: () =>
        object(
          'google/gemini-2.5-flash',
          questionsSchema,
          'Your role is to generate high-quality evaluation questions for listings, strictly adhering to the rules provided with each description and type.',
          generateListingQuestionsPrompt(text, type),
          { timeout: false },
        ),
      catch: (cause) => new AiFailed({ cause }),
    });
    return result.eligibilityQuestions;
  });

  const rewards = Effect.fn('ListingAi.rewards')(function* (
    userId: string,
    request: RewardsRequest,
  ) {
    yield* limited(userId);
    const token = yield* tokens.bySymbol(request.token, {
      includeInactive: true,
    });
    const result = yield* Effect.tryPromise({
      try: () =>
        object(
          'google/gemini-2.5-flash',
          rewardsSchema,
          'Your role is to generate proper rewards for listings, strictly adhering to the rules provided with each description and type.',
          generateListingRewardsPrompt({
            ...request,
            tokenName: token?.tokenName,
          }),
          { timeout: false },
        ),
      catch: (cause) => new AiFailed({ cause }),
    });
    const record: Record<string, number> = {};
    for (const item of result.rewards) record[item.rank] = item.amount;
    return { ...result, rewards: record };
  });

  const skills = Effect.fn('ListingAi.skills')(function* (
    userId: string,
    text: string,
  ) {
    yield* limited(userId);
    const prompt = generateListingSkillsPrompt(text);
    const system =
      'Your role is to generate proper skills for listings, strictly adhering to the rules provided with each description and type.';
    const fallback: Skills = [
      { skills: 'Other', subskills: ['Product Manager'] },
    ];
    return yield* firstOf(
      ['google/gemini-2.5-flash', 'google/gemini-2.0-flash-lite-001'].map(
        (model) => () =>
          object(model, skillsSchema, system, prompt).then(
            (answer) => answer.skills,
          ),
      ),
      () => fallback,
    );
  });

  const token = Effect.fn('ListingAi.token')(function* (
    userId: string,
    text: string,
  ) {
    yield* limited(userId);
    const symbols = (yield* tokens.list).map((item) => item.tokenSymbol);
    const prompt = generateListingTokenPrompt(text, symbols);
    const system =
      'Your role is to extract the token mentioned in the listings.';
    return yield* firstOf(
      [
        () =>
          object('openai/gpt-oss-120b', tokenSchema, system, prompt, {
            baseten: true,
          }),
        () =>
          object(
            'google/gemini-2.0-flash-lite-001',
            tokenSchema,
            system,
            prompt,
          ),
      ],
      () => ({ token: null }),
    );
  });

  return ListingAi.of({
    description,
    title,
    questions,
    rewards,
    skills,
    token,
  });
});

export const layer = Layer.effect(ListingAi, make);
