import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { ErrorInfo } from '@/components/shared/ErrorInfo';
import { Loading } from '@/components/shared/Loading';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { GrantsPop } from '@/features/conversion-popups/components/GrantsPop';
import { GrantEntry } from '@/features/grants/components/GrantEntry';
import { grantsQuery } from '@/features/grants/queries/grants';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

function Grants() {
  const {
    data: grants,
    isLoading,
    isError,
  } = useQuery(grantsQuery({ order: 'desc' }));

  return (
    <Default
      meta={
        <Meta
          title="Grants | Superteam Earn"
          description="Discover Solana Grants for Development, Art, Content, and more to fund your ideas"
          canonical="https://earn.superteam.fun/grants/"
          og={ASSET_URL + `/og/grants.png`}
        />
      }
    >
      <GrantsPop />
      <div className="relative flex min-h-screen w-full flex-col justify-center bg-neutral-100">
        <ExternalImage
          className="absolute left-0 right-0 top-0 h-full w-full"
          alt=""
          src={'/home/bg_grad.svg'}
        />
        <div className="my-16 flex flex-col gap-4 text-center">
          <p className="px-2 text-4xl font-bold md:text-5xl">
            Need funds to build out your idea?
          </p>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 md:text-xl">
            Discover the complete list of crypto grants available to support
            your project. Fast, equity-free funding without the hassle.
          </p>
          <p className="mt-3 text-sm text-slate-400 md:text-base">
            Equity-Free • No Bullshit • Fast AF
          </p>
        </div>
        <div className="container mx-auto mb-12 max-w-7xl px-4">
          {isLoading && <Loading />}
          {isError && <ErrorInfo />}
          {!isLoading && !isError && (
            <div className="flex flex-wrap justify-center gap-10">
              {grants?.map((grant) => (
                <div key={grant?.id} className="flex-shrink-0">
                  <GrantEntry
                    title={grant?.title}
                    slug={grant.slug}
                    minReward={grant?.minReward}
                    maxReward={grant?.maxReward}
                    token={grant?.token}
                    logo={grant?.logo}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Default>
  );
}

export default Grants;
