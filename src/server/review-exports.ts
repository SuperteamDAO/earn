import 'server-only';

import { v2 as cloudinary } from 'cloudinary';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';
import Papa from 'papaparse';

import * as AppConfig from '@/server/app-config';
import * as Database from '@/server/database';
import {
  type ListingNotFound,
  type NotYourListing,
  ownedListing,
} from '@/server/review';
import type * as Users from '@/server/users';
import { plainTextFromHtmlTurndown } from '@/utils/plainTextFromHtml';

import { BONUS_POSITION } from '@/features/sponsor-dashboard/utils/review-rules';

export class ExportFailed extends Schema.TaggedError<ExportFailed>()(
  'ExportFailed',
  { operation: Schema.String, cause: Schema.Defect() },
) {
  override get message() {
    return `Export failed: ${this.operation}`;
  }
}

export type ExportRow = Readonly<Record<string, string | number | null>>;

type ExportErrors =
  | ExportFailed
  | ListingNotFound
  | NotYourListing
  | Database.DatabaseError;

// A listing's submissions as a spreadsheet for its sponsor: a CSV on
// Cloudinary, or a Google Sheet anyone with the link can read (Earn's
// submission export routes).
export class ReviewExports extends Context.Service<
  ReviewExports,
  {
    readonly csv: (
      writer: Users.SponsorWriter,
      listingId: string,
    ) => Effect.Effect<string, ExportErrors>;
    readonly sheet: (
      writer: Users.SponsorWriter,
      listingId: string,
    ) => Effect.Effect<string, ExportErrors>;
  }
>()('earn/ReviewExports') {}

const DAY_MS = 24 * 60 * 60 * 1000;

const text = (html: string | null | undefined) =>
  plainTextFromHtmlTurndown.turndown(html ?? '');

const answersOf = (value: unknown) =>
  Array.isArray(value)
    ? value.flatMap((item: unknown) => {
        if (!item || typeof item !== 'object') return [];
        const question: unknown = Reflect.get(item, 'question');
        const answer: unknown = Reflect.get(item, 'answer');
        return typeof question === 'string'
          ? [{ question, answer: typeof answer === 'string' ? answer : '' }]
          : [];
      })
    : [];

const GoogleToken = Schema.Struct({ access_token: Schema.String });
const GoogleFile = Schema.Struct({ id: Schema.String });

// Google takes this many rows a request at most.
const ROWS_PER_WRITE = 10_000;

const google = (
  operation: string,
  url: string,
  init: { method: string; token?: string; body?: unknown; form?: string },
) =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(url, {
        method: init.method,
        headers: {
          ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
          'Content-Type': init.form
            ? 'application/x-www-form-urlencoded'
            : 'application/json',
        },
        body: init.form ?? (init.body ? JSON.stringify(init.body) : undefined),
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`Google ${response.status}`);
      return (await response.json()) as unknown;
    },
    catch: (cause) => new ExportFailed({ operation, cause }),
  });

const decode =
  <A>(schema: Schema.Codec<A>, operation: string) =>
  (value: unknown) =>
    Schema.decodeUnknownEffect(schema)(value).pipe(
      Effect.mapError((cause) => new ExportFailed({ operation, cause })),
    );

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const database = yield* Database.Database;

  const rowsFor = (writer: Users.SponsorWriter, listingId: string) =>
    Effect.gen(function* () {
      const listing = yield* ownedListing(
        database,
        writer.sponsorId,
        listingId,
      );
      const submissions = yield* database.query('exportSubmissions', (client) =>
        client.submission.findMany({
          where: { listingId, isActive: true, isArchived: false },
          include: { user: true },
          orderBy: { createdAt: 'asc' },
        }),
      );
      const now = yield* Clock.currentTimeMillis;
      const questions = [
        ...new Set(
          submissions.flatMap((submission) =>
            answersOf(submission.eligibilityAnswers).map(
              (answer) => answer.question,
            ),
          ),
        ),
      ];
      const rows = submissions.map((submission, i): ExportRow => {
        const { user } = submission;
        const age = Math.floor(
          Math.abs(now - user.createdAt.getTime()) / DAY_MS,
        );
        const answers = answersOf(submission.eligibilityAnswers);
        const eligibility: Record<string, string> = {};
        for (const question of questions) {
          const answer = answers.find((each) => each.question === question);
          eligibility[question] = answer ? text(answer.answer) : '';
        }
        return {
          'Sr no': i + 1,
          'Profile Link': `https://superteam.fun/earn/t/${user.username}`,
          Name: `${user.firstName} ${user.lastName}`,
          'Submission Link': submission.link || '',
          ...eligibility,
          'Anything Else': text(submission.otherInfo),
          'Tweet Link': submission.tweet || '',
          'Email ID': user.email,
          'User Twitter': user.twitter || '',
          'User Telegram': user.telegram || '',
          'User Wallet': user.walletAddress,
          'User Location': user.location || '',
          Label: submission.label,
          'Winner Position': submission.isWinner
            ? submission.winnerPosition === BONUS_POSITION
              ? 'Bonus'
              : submission.winnerPosition
            : '',
          'Account Age': `${age} day${age > 1 ? 's' : ''} ago`,
          Notes: text(submission.notes),
        };
      });
      return { listing, rows, now };
    });

  const csv = Effect.fn('ReviewExports.csv')(function* (
    writer: Users.SponsorWriter,
    listingId: string,
  ) {
    const { listing, rows, now } = yield* rowsFor(writer, listingId);
    const settings = config.cloudinary;
    if (!settings) {
      return yield* new ExportFailed({
        operation: 'csv',
        cause: 'Cloudinary not configured',
      });
    }
    const fileName = `${listing.slug || listingId}-submissions-${now}`;
    const content = `data:text/csv;base64,${Buffer.from(Papa.unparse([...rows]), 'utf8').toString('base64')}`;
    const uploaded = yield* Effect.tryPromise({
      try: () =>
        cloudinary.uploader.upload(content, {
          cloud_name: settings.cloudName,
          api_key: settings.apiKey,
          api_secret: Redacted.value(settings.apiSecret),
          public_id: `${fileName}.csv`,
          folder: settings.submissionsFolder,
          resource_type: 'raw',
          type: 'private',
          access_type: 'anonymous',
          tags: [listingId],
        }),
      catch: (cause) => new ExportFailed({ operation: 'csv', cause }),
    });
    return uploaded.secure_url || uploaded.url;
  });

  const sheet = Effect.fn('ReviewExports.sheet')(function* (
    writer: Users.SponsorWriter,
    listingId: string,
  ) {
    const { listing, rows, now } = yield* rowsFor(writer, listingId);
    const settings = config.sheets;
    if (!settings) {
      return yield* new ExportFailed({
        operation: 'sheet',
        cause: 'Google Sheets not configured',
      });
    }
    const { access_token: token } = yield* google(
      'token',
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        form: new URLSearchParams({
          client_id: settings.clientId,
          client_secret: Redacted.value(settings.clientSecret),
          refresh_token: Redacted.value(settings.refreshToken),
          grant_type: 'refresh_token',
        }).toString(),
      },
    ).pipe(Effect.flatMap(decode(GoogleToken, 'token')));
    const date = new Date(now).toISOString().slice(0, 10);
    const { id } = yield* google(
      'createFile',
      'https://www.googleapis.com/drive/v3/files?fields=id',
      {
        method: 'POST',
        token,
        body: {
          name: `${listing.title || listingId} - Submissions - ${date}`,
          mimeType: 'application/vnd.google-apps.spreadsheet',
          parents: settings.folderId ? [settings.folderId] : undefined,
        },
      },
    ).pipe(Effect.flatMap(decode(GoogleFile, 'createFile')));

    const headers = Object.keys(rows[0] ?? {});
    const values =
      rows.length === 0
        ? []
        : [
            [
              'Please go to File -> Make a Copy to duplicate and edit this document',
            ],
            [],
            headers,
            ...rows.map((row) =>
              headers.map((header) => {
                const value = row[header];
                return value === null || value === undefined
                  ? ''
                  : String(value);
              }),
            ),
          ];
    for (let start = 0; start < values.length; start += ROWS_PER_WRITE) {
      yield* google(
        'writeValues',
        `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/Sheet1!A${start + 1}?valueInputOption=RAW`,
        {
          method: 'PUT',
          token,
          body: { values: values.slice(start, start + ROWS_PER_WRITE) },
        },
      );
    }

    // Earn's look: the note merged and bold, a grey header row, wrapped
    // cells, columns sized to their content.
    const width = (index: number) => {
      const header = headers[index] ?? '';
      const lengths = [
        header.length,
        ...rows.flatMap((row) => {
          const value = row[header];
          return value === null || value === undefined
            ? []
            : [String(value).length];
        }),
      ];
      const average = lengths.reduce((sum, n) => sum + n, 0) / lengths.length;
      return Math.min(
        Math.max(Math.ceil(average * 8 + 20), index === 0 ? 60 : 100),
        400,
      );
    };
    yield* google(
      'format',
      `https://sheets.googleapis.com/v4/spreadsheets/${id}:batchUpdate`,
      {
        method: 'POST',
        token,
        body: {
          requests: [
            {
              mergeCells: {
                range: {
                  sheetId: 0,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 5,
                },
                mergeType: 'MERGE_ALL',
              },
            },
            {
              repeatCell: {
                range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
                cell: {
                  userEnteredFormat: {
                    textFormat: { fontSize: 10, bold: true },
                    wrapStrategy: 'WRAP',
                    verticalAlignment: 'MIDDLE',
                  },
                },
                fields:
                  'userEnteredFormat(textFormat,wrapStrategy,verticalAlignment)',
              },
            },
            {
              repeatCell: {
                range: { sheetId: 0, startRowIndex: 2, endRowIndex: 3 },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 226 / 255,
                      green: 226 / 255,
                      blue: 226 / 255,
                    },
                    textFormat: { bold: true },
                    wrapStrategy: 'WRAP',
                  },
                },
                fields:
                  'userEnteredFormat(backgroundColor,textFormat,wrapStrategy)',
              },
            },
            {
              updateDimensionProperties: {
                range: {
                  sheetId: 0,
                  dimension: 'ROWS',
                  startIndex: 0,
                  endIndex: 1,
                },
                properties: { pixelSize: 50 },
                fields: 'pixelSize',
              },
            },
            ...headers.map((_, index) => ({
              updateDimensionProperties: {
                range: {
                  sheetId: 0,
                  dimension: 'COLUMNS',
                  startIndex: index,
                  endIndex: index + 1,
                },
                properties: { pixelSize: width(index) },
                fields: 'pixelSize',
              },
            })),
            {
              repeatCell: {
                range: { sheetId: 0, startColumnIndex: 0, endColumnIndex: 1 },
                cell: { userEnteredFormat: { horizontalAlignment: 'CENTER' } },
                fields: 'userEnteredFormat.horizontalAlignment',
              },
            },
            {
              repeatCell: {
                range: { sheetId: 0, startRowIndex: 3 },
                cell: { userEnteredFormat: { wrapStrategy: 'WRAP' } },
                fields: 'userEnteredFormat.wrapStrategy',
              },
            },
          ],
        },
      },
    );
    yield* google(
      'share',
      `https://www.googleapis.com/drive/v3/files/${id}/permissions`,
      { method: 'POST', token, body: { type: 'anyone', role: 'reader' } },
    );
    return `https://docs.google.com/spreadsheets/d/${id}`;
  });

  return ReviewExports.of({ csv, sheet });
});

export const layer = Layer.effect(ReviewExports, make);
