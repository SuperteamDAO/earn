import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import { UserFlag } from '@/components/shared/UserFlag';
import { LocalImage } from '@/components/ui/local-image';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ASSET_URL } from '@/constants/ASSET_URL';
import {
  CHAIN_NAME,
  CHANGELOG_URL,
  DISCORD_URL,
  FAQ_URL,
  GITHUB_URL,
  PROJECT_NAME,
  SUPPORT_EMAIL,
  TWITTER_URL,
} from '@/constants/project';
import { TeamRegions } from '@/constants/Team';

import {
  Discord,
  GitHub,
  Twitter,
} from '@/features/social/components/SocialIcons';

type Country = {
  name: string;
  code: string;
  slug: string;
};

const countries: Country[] = TeamRegions.map((team) => ({
  name: team.displayValue,
  code: team.code ?? 'GLOBAL',
  slug: team.region,
}));

const FooterColumn = ({
  title,
  links,
}: {
  title: string;
  links: { href: string; text: string }[];
}) => (
  <div className="flex flex-col items-start">
    <p className="mb-2 text-xs font-medium uppercase text-slate-400">{title}</p>
    <div className="flex flex-col space-y-2">
      {links.map((link) => (
        <Link
          key={link.text}
          href={link.href}
          className="text-sm text-slate-500 hover:text-slate-600"
          target="_blank"
          rel="noopener noreferrer"
        >
          {link.text}
        </Link>
      ))}
    </div>
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
    slug: '/',
  });

  useEffect(() => {
    const path = router.asPath.toLowerCase();
    const matchedCountry = countries.find((country) =>
      path.includes(`/regions/${country.slug?.toLowerCase()}`),
    );
    if (matchedCountry) {
      setSelectedCountry(matchedCountry);
    }
  }, [router.asPath]);

  const handleCountrySelect = (country: Country) => {
    if (country.name === 'Global') {
      router.push('/');
    } else {
      const regionUrl = `/regions/${country.slug.toLowerCase()}`;
      router.push(regionUrl);
    }
  };

  const dropdownCountries = [
    { name: 'Global', code: 'global', slug: '/' },
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
          <p className="select-none capitalize">{selectedCountry?.name}</p>
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
              <p className="capitalize">{country?.name}</p>
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
      href: FAQ_URL,
    },
    { text: 'Terms', href: '/terms-of-use.pdf' },
    { text: 'Privacy Policy', href: '/privacy-policy.pdf' },
    {
      text: 'Changelog',
      href: CHANGELOG_URL,
    },
    { text: 'Contact Us', href: `mailto:${SUPPORT_EMAIL}` },
  ];

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-start justify-between md:flex-row">
          <div className="mb-8 flex max-w-[540px] flex-col md:mb-0">
            <div className="mb-4 flex items-center">
              <LocalImage
                className="mr-4 h-6"
                alt={`${PROJECT_NAME} Logo`}
                src="/assets/logo.svg"
              />
            </div>
            <p className="mb-6 text-sm text-slate-500">
              Discover high paying crypto bounties, projects and grants from the
              best {CHAIN_NAME} companies in one place and apply to them using a
              single profile.
            </p>
            <div className="flex gap-4">
              {GITHUB_URL && (
                <GitHub link={GITHUB_URL} className="text-slate-500" />
              )}
              {TWITTER_URL && (
                <Twitter link={TWITTER_URL} className="text-slate-500" />
              )}
              {DISCORD_URL && (
                <Discord link={DISCORD_URL} className="text-slate-500" />
              )}
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
              © {currentYear} {PROJECT_NAME}. All rights reserved.
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
