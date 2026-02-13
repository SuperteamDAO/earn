import { ExternalImage } from '@/components/ui/cloudinary-image';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

import { GrantsPop } from '@/features/conversion-popups/components/GrantsPop';
import { SeoFaq } from '@/features/home/components/SeoFaq';
import { GrantEntry } from '@/features/grants/components/GrantEntry';
import { useGrants } from '@/features/grants/hooks/useGrants';

function Grants() {
  const { data: grants } = useGrants({
    context: 'all',
    category: 'All',
  });

  return (
    <Default
      meta={
        <Meta
          title="Grants | Superteam Earn"
          description="Discover Solana Grants for Development, Art, Content, and more to fund your ideas"
          canonical="https://superteam.fun/earn/grants/"
          og={ASSET_URL + `/og/grants.png`}
        />
      }
    >
      <GrantsPop />
      <div className="relative flex min-h-screen w-full flex-col justify-center bg-neutral-100">
        <ExternalImage
          className="absolute top-0 right-0 left-0 h-full w-full"
          alt=""
          src={'/home/bg_grad.svg'}
        />
        <div className="my-16 flex flex-col gap-4 text-center">
          <h1 className="px-2 text-4xl font-bold md:text-5xl">
            Crypto Grants &amp; Web3 Funding for Builders
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 md:text-xl">
            Explore equity-free crypto grants designed to help founders and
            builders ship in the Solana ecosystem. Apply for fast, transparent
            funding to develop products, research ideas, and grow projects.
          </p>
          <p className="mt-3 text-sm text-slate-400 md:text-base">
            Equity-Free • No Bullshit • Fast AF
          </p>
        </div>
        <div className="container mx-auto mb-12 max-w-7xl px-4">
          <div className="flex flex-wrap justify-center gap-10">
            {grants?.map((grant) => (
              <div key={grant?.id} className="w-full max-w-[20rem]">
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
        </div>
        <div className="container mx-auto mb-12 max-w-md px-4">
          <SeoFaq />
        </div>
      </div>
    </Default>
  );
}

export default Grants;
