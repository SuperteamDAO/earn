import 'server-only';

import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';

import * as AppConfig from '@/server/app-config';

// A perk as superteam.fun's /member-perks/ shows it: Airtable's fields.
interface Perk {
  readonly fields: {
    readonly Name: string;
    readonly Notes?: string;
    readonly Link?: string;
    readonly Logo?: ReadonlyArray<{ readonly url: string }>;
  };
}

export interface PerksByStatus {
  readonly liveNow: ReadonlyArray<Perk>;
  readonly completed: ReadonlyArray<Perk>;
  readonly comingSoon: ReadonlyArray<Perk>;
}

const EMPTY: PerksByStatus = { liveNow: [], completed: [], comingSoon: [] };

const Records = Schema.Struct({
  records: Schema.Array(
    Schema.Struct({
      createdTime: Schema.optional(Schema.String),
      fields: Schema.Record(Schema.String, Schema.Unknown),
    }),
  ),
});

type AirtableRecord = (typeof Records.Type)['records'][number];

const text = (value: unknown) =>
  typeof value === 'string' ? value : undefined;

const toPerk = ({ fields }: AirtableRecord): Perk => {
  const logo = Array.isArray(fields['Logo'])
    ? fields['Logo'].flatMap((item: unknown) => {
        const url =
          typeof item === 'object' && item !== null && 'url' in item
            ? text(item.url)
            : undefined;
        return url ? [{ url }] : [];
      })
    : undefined;
  return {
    fields: {
      Name: text(fields['Name']) ?? '',
      Notes: text(fields['Notes']),
      Link: text(fields['Link']),
      Logo: logo,
    },
  };
};

// Sorts Airtable's perks newest first and groups them by status, as Earn's
// page did.
export const groupPerks = (
  records: ReadonlyArray<AirtableRecord>,
): PerksByStatus => {
  const time = (record: AirtableRecord) =>
    record.createdTime ? new Date(record.createdTime).getTime() : 0;
  const sorted = records.toSorted((a, b) => time(b) - time(a));
  const withStatus = (status: string) =>
    sorted.filter((record) => record.fields['Status'] === status).map(toPerk);
  return {
    liveNow: withStatus('Live now'),
    completed: withStatus('Completed'),
    comingSoon: withStatus('Coming Soon'),
  };
};

// The member perks listed in Earn's Airtable base. Cached for a minute (Earn
// cached the page that long at the edge); when Airtable fails, or isn't
// configured, there are none.
export class MemberPerks extends Context.Service<
  MemberPerks,
  { readonly list: Effect.Effect<PerksByStatus> }
>()('earn/MemberPerks') {}

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const airtable = config.airtable;
  const table = airtable?.perksTable;

  const load = Effect.gen(function* () {
    if (!airtable?.base || !table) {
      yield* Effect.logWarning('Airtable perks not configured');
      return EMPTY;
    }
    const url = `https://api.airtable.com/v0/${airtable.base}/${encodeURIComponent(table)}`;
    const body = yield* Effect.tryPromise(() =>
      fetch(url, {
        headers: { Authorization: `Bearer ${Redacted.value(airtable.token)}` },
        signal: AbortSignal.timeout(10_000),
      }).then((response): Promise<unknown> =>
        response.ok
          ? response.json()
          : Promise.reject(new Error(`Airtable ${response.status}`)),
      ),
    );
    const { records } = yield* Schema.decodeUnknownEffect(Records)(body);
    return groupPerks(records);
  });

  const cached = yield* Effect.cachedWithTTL(load, (exit) =>
    Exit.isSuccess(exit) ? '1 minute' : 0,
  );

  const list = cached.pipe(
    Effect.catch(() =>
      Effect.logError('Fetching perks from Airtable failed').pipe(
        Effect.as(EMPTY),
      ),
    ),
  );

  return MemberPerks.of({ list });
});

export const layer = Layer.effect(MemberPerks, make);
