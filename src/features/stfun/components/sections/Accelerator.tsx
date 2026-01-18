'use client';

import { useState } from 'react';

import { ASSET_URL } from '@/constants/ASSET_URL';

import PartnerCard from '../cards/PartnerCard';

function generateStars(
  count: number,
  width: number,
  height: number,
  seedOffset: number = 0,
): string {
  const stars = [];
  let seed = count + seedOffset;
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = 0; i < count; i++) {
    const x = Math.floor(seededRandom() * width);
    const y = Math.floor(seededRandom() * height);
    stars.push(`${x}px ${y}px #FFF`);
  }
  return stars.join(', ');
}

const partnerStars1 = generateStars(800, 2560, 1600, 50000);
const partnerStars2 = generateStars(400, 2560, 1600, 60000);
const partnerStars3 = generateStars(100, 2560, 1600, 70000);

const partners1 = [
  {
    imageUrl: '/assets/fast-tracks/orangedao.svg',
    name: 'OrangeDAO',
    description:
      'Orange DAO is building the digital nation of founders helping each other.',
    url: 'https://www.orangedao.xyz/',
    perks:
      'Special Sign up sheet + expedited reviews for Orange DAO Fellowships.',
    duration: '12 weeks',
    funding: '$100k',
    type: 'Virtual',
  },
  {
    imageUrl: '/assets/fast-tracks/alliance.svg',
    name: 'Alliance DAO',
    description:
      'Alliance is the leading crypto accelerator & founder community.',
    url: 'https://www.alliance.xyz/',
    perks:
      'Personalized support from the team + feedback on application drafts, strategic advice for startup narrative, guidance on application strategy & interview preparation.',
    duration: '4 in NY office + 8 remote',
    funding: '$350k',
    type: 'Hybrid',
  },
  {
    imageUrl: '/assets/fast-tracks/outlier.svg',
    name: 'Outlier Ventures',
    description:
      'A leading web3 accelerator, with 300+ portfolio companies & supporting founders 360°.',
    url: 'https://www.outlierventures.io/base-camp/',
    perks:
      'When applying comment "Superteam" in the referral section at the end of your application to get direct exposure to the Outlier investment team and receive an expedient review on your submission.',
    duration: '12 weeks',
    funding: 'upto $200k',
    type: 'Virtual',
  },
];

const partners2 = [
  {
    imageUrl: '/assets/fast-tracks/colosseum.svg',
    name: 'Colosseum',
    description:
      "An organization running Solana's hackathons, accelerating select winners, and investing in their breakout startups.",
    url: 'https://www.colosseum.org/',
    perks:
      'Get invited to a special Zoom call, get competition strategies & project submission tips. Chance to get fast tracked into Colosseum if recommended by a Superteam Lead!',
    duration: '6 week hackathon + 6 week accelerator',
    funding: '$250k',
    type: 'Virtual',
  },
  {
    imageUrl: '/assets/fast-tracks/solanaincubator.svg',
    name: 'Solana Incubator',
    description:
      'The Solana Incubator is an in-person 3 month program where founders can build their companies alongside Solana Labs.',
    url: 'https://incubator.solanalabs.com/',
    perks:
      'Get invited to a special Zoom call to learn more about the application process and ways to maximize your chances of acceptance. Also, chance to get referred in by a Superteam lead!',
    duration: '3 months',
    funding: '-',
    type: 'In-Person',
  },
  {
    imageUrl: '/assets/fast-tracks/spring.svg',
    name: 'SpringX',
    description:
      'Initiated by BuilderDAO, SuperteamDAO, SevenX Ventures, & ABCDE Labs- it supports early-stage entrepreneurs with education, funding, & resources.',
    url: 'https://www.springx.net/',
    perks:
      'Best teams get recommended to the SpringX Accelerator Program at the Solana APAC Summit in Malaysia in June 2024.',
    duration: '3 weeks offline + 6 month online follow up',
    funding: 'Conduct IRL workshops, mentoring sessions & investor meetups',
    type: 'Virtual',
  },
  {
    imageUrl: '/assets/fast-tracks/bfg.svg',
    name: 'Blockchain Founders Group',
    description:
      'Get 1-1 weekly mentoring, access to seed investor network across Europe and tap into an ecosystem of subject matter experts and advisors on niche topics like tokenomics and legal.',
    url: 'https://blockchain-founders.io/startup-accelerator-bfg-adrenaline',
    perks:
      'Fast track evaluation, and tailored feedback to every project that applies regardless of outcome.',
    duration: '8 weeks, remote',
    funding: '100k in USD/EUR (Depending on which currency you raise with)',
    type: 'Virtual',
  },
  {
    imageUrl: '/assets/fast-tracks/kompass.svg',
    name: 'Kompass',
    description: 'A bespoke Web3 accelerator where builders back builders.',
    url: 'https://kompass.vc/',
    perks:
      "Prioritized application process and expdited review of your submission. Please mention 'Superteam' as the referrer.",
    duration: '6 months, remote',
    funding: '$125k',
    type: 'Virtual',
  },
];

export default function Accelerator() {
  const [showAllPartners, setShowAllPartners] = useState(false);

  const displayedPartners = showAllPartners
    ? [...partners1, ...partners2]
    : partners1;

  return (
    <section className="relative flex w-full flex-col items-center justify-center py-32 text-center text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="stars-no-fade absolute"
          style={{ boxShadow: partnerStars1 }}
        />
        <div
          className="stars2-no-fade absolute"
          style={{ boxShadow: partnerStars2 }}
        />
        <div
          className="stars3-no-fade absolute"
          style={{ boxShadow: partnerStars3 }}
        />
      </div>
      <div
        className="z-1 mb-32 w-full bg-contain bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${ASSET_URL}/st/fast-tracks/BgGradient.png')`,
        }}
      >
        <div className="box-border w-full max-w-full px-8 pb-12 md:px-16 lg:px-32 xl:px-48 2xl:px-64">
          <p className="accelerator-heading mt-8 mb-3 text-center text-[38px] leading-[110%] font-bold text-white">
            Ecosystem Partners
          </p>
          <p className="accelerator-description mb-[3.75rem] text-center text-lg leading-[160%] text-white">
            When applying to any program, let your local Superteam lead know.
            This allows <br className="hidden md:block" />
            Superteam to individually support you in getting into an
            acceleration program.
          </p>
          <div className="flex w-full min-w-0 flex-col items-center justify-center gap-6">
            {displayedPartners.map((partner, index) => (
              <PartnerCard
                key={index}
                imageUrl={partner.imageUrl}
                name={partner.name}
                description={partner.description}
                url={partner.url}
                perks={partner.perks}
                duration={partner.duration}
                funding={partner.funding}
                type={partner.type}
              />
            ))}
          </div>
          {!showAllPartners && (
            <div className="mt-8 flex w-full shrink-0 items-center justify-center">
              <button
                className="accelerator-btn flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-base leading-[160%] font-bold tracking-[-0.04rem] text-black transition-opacity hover:opacity-90"
                type="button"
                onClick={() => setShowAllPartners(true)}
              >
                Load more programs
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
