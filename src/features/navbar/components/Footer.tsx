import NextLink from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import { UserFlag } from '@/components/shared/UserFlag';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { Superteams } from '@/constants/Superteam';
import { Discord, GitHub, Twitter } from '@/features/talent';

type Country = {
  name: string;
  code: string;
};

const countries: Country[] = Superteams.map((superteam) => ({
  name: superteam.displayValue,
  code: superteam.code ?? 'GLOBAL',
}));

const FooterColumn = ({
  title,
  links,
}: {
  title: string;
  links: { href: string; text: string }[];
}) => (
  <div className="flex flex-col items-start">
    <p className="text-xs font-medium uppercase text-slate-400 md:text-sm">
      {title}``
    </p>
    {links.map((link) => (
      <NextLink
        key={link.text}
        href={link.href}
        className="text-sm text-slate-500 hover:text-slate-600 md:text-base"
      >
        {link.text}
      </NextLink>
    ))}
  </div>
);

const GlobalFlag = ({ size = '16px' }) => (
  <div
    className="flex items-center justify-center rounded-full border border-slate-50 bg-contain"
    style={{
      width: size,
      height: size,
      backgroundImage: `url('${ASSET_URL}/superteams/globe.png')`,
    }}
  />
);

const CountrySelector: React.FC = () => {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    name: 'Global',
    code: 'global',
  });

  useEffect(() => {
    const path = router.asPath.toLowerCase();
    const matchedCountry = countries.find((country) =>
      path.includes(`/regions/${country.name.toLowerCase()}`),
    );
    if (matchedCountry) {
      setSelectedCountry(matchedCountry);
    }
  }, [router.asPath]);

  const handleCountrySelect = (country: Country) => {
    if (country.name === 'Global') {
      router.push('/');
    } else {
      const regionUrl = `/regions/${country.name.toLowerCase()}`;
      router.push(regionUrl);
    }
  };

  const dropdownCountries = [
    { name: 'Global', code: 'global' },
    ...countries.filter((country) => country.name !== 'Global'),
  ];

  return (
    <Popover>
      <PopoverTrigger>
        <div className="flex cursor-pointer items-center gap-2 rounded-md bg-white px-2 py-1">
          {selectedCountry.code === 'global' ? (
            <GlobalFlag />
          ) : (
            <UserFlag location={selectedCountry.code} isCode />
          )}
          <p className="select-none">{selectedCountry.name}</p>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <div className="flex flex-col gap-0">
          {dropdownCountries.map((country) => (
            <div
              key={country.name}
              className="flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-gray-100"
              onClick={() => handleCountrySelect(country)}
            >
              {country.code === 'global' ? (
                <GlobalFlag />
              ) : (
                <UserFlag location={country.code} isCode />
              )}
              <p>{country.name}</p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const opportunities = [
    { text: 'Bounties', href: '/bounties' },
    { text: 'Projects', href: '/projects' },
    { text: 'Grants', href: '/grants' },
  ];

  const categories = [
    { text: 'Content', href: '/category/content' },
    { text: 'Design', href: '/category/design' },
    { text: 'Development', href: '/category/development' },
    { text: 'Others', href: '/category/other' },
  ];

  const about = [
    {
      text: 'FAQ',
      href: 'https://superteamdao.notion.site/Superteam-Earn-FAQ-aedaa039b25741b1861167d68aa880b1?pvs=4',
    },
    {
      text: 'Terms',
      href: 'https://drive.google.com/file/d/1ybbO_UOTaIiyKb4Mbm3sNMbjTf5qj5mT/view',
    },
    { text: 'Privacy Policy', href: '/privacy-policy.pdf' },
    {
      text: 'Changelog',
      href: 'https://superteamdao.notion.site/Superteam-Earn-Changelog-faf0c85972a742699ecc07a52b569827',
    },
    { text: 'Contact Us', href: 'mailto:support@superteamearn.com' },
  ];

  return (
    <footer className="border-t border-black/20 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-start justify-between md:flex-row">
          <div className="mb-8 flex max-w-[540px] flex-col md:mb-0">
            <div className="mb-4 flex items-center">
              <img
                className="mr-4 h-6"
                alt="Superteam Earn"
                src="/assets/logo.svg"
              />
            </div>
            <p className="mb-6 text-sm text-slate-500 md:text-base">
              Discover high paying crypto bounties, projects and grants from the
              best Solana companies in one place and apply to them using a
              single profile.
            </p>
            <div className="flex gap-4">
              <GitHub link="https://github.com/SuperteamDAO/earn" />
              <Twitter link="https://twitter.com/superteamearn" />
              <Discord link="https://discord.com/invite/Mq3ReaekgG" />
            </div>
          </div>
          <div className="flex w-full flex-wrap justify-start gap-6 md:w-auto md:justify-end md:gap-16">
            <FooterColumn title="Opportunities" links={opportunities} />
            <FooterColumn title="Categories" links={categories} />
            <FooterColumn title="About" links={about} />
          </div>
        </div>
      </div>
      <div className="bg-gray-100 py-4 pb-20 md:pb-4">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-start justify-between md:flex-row md:items-center">
            <p className="mb-4 text-sm text-slate-500 md:mb-0">
              © {currentYear} Superteam. All rights reserved.
            </p>
            <div className="flex items-center">
              <p className="mr-2 text-sm font-medium text-slate-500">REGION</p>
              <CountrySelector />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
