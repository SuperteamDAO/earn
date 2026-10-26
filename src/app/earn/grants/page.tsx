import * as Effect from 'effect/Effect';

import { ErrorInfo } from '@/components/shared/ErrorInfo';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { Default } from '@/layouts/Default';
import { pageMetadata } from '@/lib/metadata';
import { getViewer } from '@/lib/session';
import * as GrantLists from '@/server/grant-lists';
import { runtime } from '@/server/runtime';

import { GrantEntries } from './grant-entries';

export const metadata = pageMetadata({
  title: 'Grants | Superteam Earn',
  description:
    'Discover Solana Grants for Development, Art, Content, and more to fund your ideas',
  canonical: 'https://superteam.fun/earn/grants/',
  og: ASSET_URL + `/og/grants.png`,
});

export default async function Grants() {
  const viewer = await getViewer();
  const grants = await runtime.runPromise(
    GrantLists.GrantLists.use((lists) =>
      lists.list({ context: 'all', category: 'All' }, viewer),
    ).pipe(Effect.orElseSucceed(() => null)),
  );

  return (
    <Default>
      <div className="relative flex min-h-screen w-full flex-col justify-center bg-neutral-100">
        <ExternalImage
          className="absolute top-0 right-0 left-0 h-full w-full"
          alt=""
          src={'/home/bg_grad.svg'}
        />
        <div className="my-16 flex flex-col gap-4 text-center">
          <h1 className="px-2 text-4xl font-bold md:text-5xl">
            Crypto Grants & Web3 Funding
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 md:text-xl">
            Explore equity-free crypto grants that help you turn ideas into real
            products in the Solana ecosystem.
          </p>
          <p className="mt-3 text-sm text-slate-400 md:text-base">
            Equity-Free • No Bullshit • Fast AF
          </p>
        </div>
        <div className="container mx-auto mb-12 max-w-7xl px-4">
          {!grants && <ErrorInfo />}
          <div className="flex flex-wrap justify-center gap-10">
            {grants && <GrantEntries grants={grants} />}
          </div>
        </div>
      </div>
    </Default>
  );
}
