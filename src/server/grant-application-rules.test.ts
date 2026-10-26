import { assert, describe, it } from '@effect/vitest';
import * as Option from 'effect/Option';

import {
  type ApplicationBody,
  type ApplicationGrant,
  validateApplication,
} from '@/server/grant-application-rules';

const WALLET = '11111111111111111111111111111111';

const grant = (
  overrides: Partial<ApplicationGrant> = {},
): ApplicationGrant => ({
  title: 'Builder Grants',
  token: 'USDC',
  minReward: 100,
  maxReward: 5000,
  isST: false,
  questions: [],
  ...overrides,
});

// What Earn's form posts after its resolver: links, not usernames.
const body = (overrides: Partial<ApplicationBody> = {}): ApplicationBody => ({
  grantId: 'g1',
  projectTitle: 'Project',
  projectOneLiner: 'One line',
  projectDetails: '<p>Details</p>',
  projectTimeline: '2026-12-01',
  proofOfWork: '<p>Proof</p>',
  milestones: '<p>Milestones</p>',
  kpi: '<p>KPI</p>',
  walletAddress: WALLET,
  ask: 1000,
  twitter: 'https://x.com/adalove',
  github: 'https://github.com/ada',
  telegram: 'https://t.me/adalove',
  answers: [],
  ...overrides,
});

const check = (
  input: ApplicationBody,
  rules = grant(),
  verified: ReadonlyArray<string> = ['adalove'],
  editing = false,
) => validateApplication(input, rules, verified, { editing });

describe('validateApplication', () => {
  it('accepts a complete application and keeps links as Earn stores them', () => {
    const result = check(body());
    assert.isTrue(Option.isSome(result));
    const valid = Option.getOrThrow(result);
    assert.strictEqual(valid.twitter, 'https://x.com/adalove');
    assert.strictEqual(valid.github, 'https://github.com/ada');
    assert.strictEqual(valid.telegram, 'https://t.me/adalove');
    assert.strictEqual(valid.ask, 1000);
  });

  it('refuses an X account they have not verified', () => {
    assert.isTrue(Option.isNone(check(body(), grant(), [])));
  });

  it('refuses asks outside the grant’s range and bad wallets', () => {
    assert.isTrue(Option.isNone(check(body({ ask: 50 }))));
    assert.isTrue(Option.isNone(check(body({ ask: 6000 }))));
    assert.isTrue(Option.isNone(check(body({ walletAddress: 'nope' }))));
  });

  it('needs a Telegram link it can read a username from', () => {
    assert.isTrue(Option.isNone(check(body({ telegram: 'adalove' }))));
    assert.isTrue(Option.isNone(check(body({ telegram: 'https://t.me/a1' }))));
  });

  it('fixes an Agentic Engineering ask at the grant’s amount', () => {
    const agentic = grant({
      title: 'Agentic Engineering Grants',
      minReward: 200,
      maxReward: 200,
    });
    const valid = check(body({ ask: '', milestones: undefined }), agentic);
    assert.strictEqual(Option.getOrThrow(valid).ask, 200);
    assert.isTrue(Option.isNone(check(body({ ask: 150 }), agentic)));
  });

  it('needs an event grant’s Luma page and expenses, not a timeline', () => {
    const st = grant({ isST: true });
    const event = body({
      projectTimeline: undefined,
      proofOfWork: undefined,
      kpi: undefined,
      lumaLink: 'lu.ma/my-event',
      expenseBreakdown: '<p>Venue</p>',
    });
    const valid = check(event, st);
    assert.strictEqual(
      Option.getOrThrow(valid).lumaLink,
      'https://lu.ma/my-event',
    );
    assert.isTrue(
      Option.isNone(check({ ...event, lumaLink: 'example.com/x' }, st)),
    );
    assert.isTrue(Option.isNone(check({ ...event, expenseBreakdown: '' }, st)));
  });

  it('checks required and link answers to the grant’s questions', () => {
    const asking = grant({
      questions: [
        { question: 'Why?' },
        { question: 'Demo', type: 'link', optional: true },
      ],
    });
    assert.isTrue(Option.isNone(check(body({ answers: [] }), asking)));
    assert.isTrue(
      Option.isNone(
        check(
          body({
            answers: [
              { question: 'Why?', answer: 'Because' },
              { question: 'Demo', answer: 'not a link' },
            ],
          }),
          asking,
        ),
      ),
    );
    const valid = check(
      body({
        answers: [
          { question: 'Why?', answer: 'Because', optional: false },
          { question: 'Demo', answer: 'demo.example.com' },
        ],
      }),
      asking,
    );
    // Earn's schema keeps only the question and the answer.
    assert.deepStrictEqual(Option.getOrThrow(valid).answers[0], {
      question: 'Why?',
      answer: 'Because',
    });
  });

  it('drops a removed GitHub profile to null when editing', () => {
    const valid = check(body({ github: '' }), grant(), ['adalove'], true);
    assert.strictEqual(Option.getOrThrow(valid).github, null);
  });
});
