import 'server-only';

import { PrismaPlanetScale } from '@prisma/adapter-planetscale';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import * as Schema from 'effect/Schema';

import { PrismaClient } from '@/prisma/client';
import * as AppConfig from '@/server/app-config';

export class DatabaseError extends Schema.TaggedError<DatabaseError>()(
  'DatabaseError',
  { operation: Schema.String, cause: Schema.Defect() },
) {
  override get message() {
    return `Database query failed: ${this.operation}`;
  }
}

const makeClient = (url: string) =>
  new PrismaClient({
    adapter: new PrismaPlanetScale({ url, fetch }),
    // As in Earn: KYC fields never leave the database unless asked for.
    omit: {
      user: {
        kycCountry: true,
        kycAddress: true,
        kycDOB: true,
        kycIDNumber: true,
        kycIDType: true,
        kycName: true,
      },
    },
  });

type Client = ReturnType<typeof makeClient>;

// What a transaction's callback gets: the client, less what only the
// client itself may do.
export type Transaction = Omit<
  Client,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;

export class Database extends Context.Service<
  Database,
  {
    // Every query goes through here, so a failure is typed and named rather
    // than a rejected promise.
    readonly query: <A>(
      operation: string,
      run: (client: Client) => Promise<A>,
    ) => Effect.Effect<A, DatabaseError>;
  }
>()('earn/Database') {}

const make = Effect.gen(function* () {
  const config = yield* AppConfig.AppConfig;
  const client = makeClient(Redacted.value(config.databaseUrl));
  yield* Effect.addFinalizer(() => Effect.promise(() => client.$disconnect()));

  const query = <A>(operation: string, run: (client: Client) => Promise<A>) =>
    Effect.tryPromise({
      try: () => run(client),
      catch: (cause) => new DatabaseError({ operation, cause }),
    }).pipe(Effect.withSpan(`Database.${operation}`));

  return Database.of({ query });
});

export const layer = Layer.effect(Database, make);
