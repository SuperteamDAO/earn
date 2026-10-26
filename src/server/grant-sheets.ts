import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';

import * as AppConfig from '@/server/app-config';

export class SheetsUnavailable extends Schema.TaggedError<SheetsUnavailable>()(
  'SheetsUnavailable',
  {},
) {
  override get message() {
    return 'Google Sheets export is not configured';
  }
}

export class SheetsError extends Schema.TaggedError<SheetsError>()(
  'SheetsError',
  { operation: Schema.String, cause: Schema.Defect() },
) {
  override get message() {
    return `Google request failed: ${this.operation}`;
  }
}

export type Row = Readonly<Record<string, string | number>>;

// Earn's "Export to Google Sheets": a new sheet in Earn's Google account,
// readable by anyone with the link, for the sponsor to copy.
export class GrantSheets extends Context.Service<
  GrantSheets,
  {
    // Succeeds with the sheet's address.
    readonly create: (
      title: string,
      rows: ReadonlyArray<Row>,
    ) => Effect.Effect<string, SheetsUnavailable | SheetsError>;
  }
>()('earn/GrantSheets') {}

const Token = Schema.Struct({ access_token: Schema.String });
const File = Schema.Struct({ id: Schema.String });

const call = (
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
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`Google ${response.status}`);
      return (await response.json()) as unknown;
    },
    catch: (cause) => new SheetsError({ operation, cause }),
  });

const decode =
  <A>(schema: Schema.Codec<A>, operation: string) =>
  (value: unknown) =>
    Schema.decodeUnknownEffect(schema)(value).pipe(
      Effect.mapError((cause) => new SheetsError({ operation, cause })),
    );

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const sheets = config.sheets;

  const create = Effect.fn('GrantSheets.create')(function* (
    title: string,
    rows: ReadonlyArray<Row>,
  ) {
    if (!sheets) return yield* new SheetsUnavailable();
    const { access_token: token } = yield* call(
      'token',
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        form: new URLSearchParams({
          client_id: sheets.clientId,
          client_secret: Redacted.value(sheets.clientSecret),
          refresh_token: Redacted.value(sheets.refreshToken),
          grant_type: 'refresh_token',
        }).toString(),
      },
    ).pipe(Effect.flatMap(decode(Token, 'token')));
    const { id } = yield* call(
      'createFile',
      'https://www.googleapis.com/drive/v3/files?fields=id',
      {
        method: 'POST',
        token,
        body: {
          name: title,
          mimeType: 'application/vnd.google-apps.spreadsheet',
          parents: sheets.folderId ? [sheets.folderId] : undefined,
        },
      },
    ).pipe(Effect.flatMap(decode(File, 'createFile')));

    const headers = Object.keys(rows[0] ?? {});
    const values = [
      ['Please go to File -> Make a Copy to duplicate and edit this document'],
      [],
      headers,
      ...rows.map((row) => headers.map((header) => String(row[header] ?? ''))),
    ];
    yield* call(
      'writeValues',
      `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/Sheet1!A1?valueInputOption=RAW`,
      { method: 'PUT', token, body: { values } },
    );
    // Earn's look: the note merged and bold, a grey header row, wrapped
    // cells, columns sized to their content.
    const width = (index: number) => {
      const header = headers[index] ?? '';
      const lengths = [
        header.length,
        ...rows.map((row) => String(row[header] ?? '').length),
      ];
      const average = lengths.reduce((sum, n) => sum + n, 0) / lengths.length;
      return Math.min(
        Math.max(Math.ceil(average * 8 + 20), index === 0 ? 60 : 100),
        400,
      );
    };
    yield* call(
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
    yield* call(
      'share',
      `https://www.googleapis.com/drive/v3/files/${id}/permissions`,
      { method: 'POST', token, body: { type: 'anyone', role: 'reader' } },
    );
    return `https://docs.google.com/spreadsheets/d/${id}`;
  });

  return GrantSheets.of({ create });
});

export const layer = Layer.effect(GrantSheets, make);
