'use client';

import { ASSET_URL } from '@/constants/ASSET_URL';

import Accordion from '../common/Accordion';

export default function CollabServices() {
  return (
    <div className="productions-container col-span-5 mt-44 flex flex-col justify-center text-center">
      <div>
        <p className="section-heading center-text mb-[48px] text-[24px] leading-[26px] md:text-[32px] lg:mb-0 lg:leading-[35px]">
          Work with Community Experts
        </p>
      </div>
      <div className="mx-auto mt-0 flex max-w-[976px] flex-col gap-[12px] px-4 lg:mt-[53px]">
        <Accordion
          image={`${ASSET_URL}/st/images/bounties_new.png`}
          heading="Bounties"
          subheading="projects for the community"
          content="Sponsor or participate in small tasks and projects in the Solana ecosystem."
          btnText="Learn more"
          btnLink="https://superteam.fun/earn"
        />
        <Accordion
          image={`${ASSET_URL}/st/images/grant_new.png`}
          heading="Instagrants"
          subheading="fast grants to incentivize builders"
          content="Fund or apply for small grants to get started any projects — code, content or community for the Solana ecosystem. You might just make the next moonshot!"
          btnText="Learn more"
          btnLink="https://superteam.fun/earn/grants/"
        />
        <Accordion
          image={`${ASSET_URL}/st/images/grant_new.png`}
          heading="Meetups"
          subheading="seed hyperlocal communities in every city"
          content="Organize events to bring contributors in your city and local universities to meet each other and earn together!"
          btnText="Learn more"
          btnLink="https://app.getriver.io/superteam"
        />
        <Accordion
          image={`${ASSET_URL}/st/images/market_new.png`}
          heading="Go To Market"
          subheading="unlock new markets with our communities"
          content="Work with contributors to create larger programs with a combination of all of the above to open whole new markets and create a new ecosystem from scratch."
          btnText="Reach out"
          btnLink="mailto:support@superteam.fun?subject=Working%20with%20Superteam&body=Hello,%20I%20wanted%20to%20explore%20the%20possibility%20of%20us%20working%20together."
        />
      </div>
    </div>
  );
}
