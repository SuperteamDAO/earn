'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import MdOutlineMail from '@/components/icons/MdOutlineMail';
import { SuperteamCombobox } from '@/components/shared/SuperteamCombobox';
import { SupportFormDialog } from '@/components/shared/SupportFormDialog';
import { LocalImage } from '@/components/ui/local-image';
import { Superteams } from '@/constants/Superteam';
import { cn } from '@/utils/cn';

import { GitHub, Twitter } from '@/features/social/components/SocialIcons';

const FooterColumn = ({
  title,
  links,
}: {
  title: string;
  links: { href?: string; text: string; supportForm?: boolean }[];
}) => (
  <div className="flex flex-col items-start">
    <p className="mb-2 text-xs font-medium text-slate-400 uppercase">{title}</p>
    <div className="flex flex-col space-y-2">
      {links
        .filter((s) => !!s.href)
        .map((link) => (
          <Link
            key={link.text}
            href={link.href || ''}
            className="text-sm text-slate-500 hover:text-slate-600"
            target="_blank"
            rel="noopener noreferrer"
          >
            {link.text}
          </Link>
        ))}
      {links
        .filter((s) => !!s.supportForm)
        .map((link) => (
          <SupportFormDialog key={link.text}>
            <button className="w-fit text-sm text-slate-500 hover:text-slate-600">
              {link.text}
            </button>
          </SupportFormDialog>
        ))}
    </div>
  </div>
);

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const router = useRouter();
  const pathname = usePathname();

  const [selectedSuperteam, setSelectedSuperteam] = useState<string | null>(
    null,
  );

  useEffect((): void => {
    const path = pathname?.toLowerCase();
    const matched = Superteams.find((team) =>
      path?.includes(`/regions/${team.slug?.toLowerCase()}`),
    );
    setSelectedSuperteam(matched ? matched.name : 'Global');
  }, [pathname]);

  const handleSuperteamChange = (value: string | null): void => {
    if (!value) {
      setSelectedSuperteam(null);
      router.push('/');
      return;
    }
    setSelectedSuperteam(value);
    const team = Superteams.find((t) => t.name === value);
    if (team?.slug) {
      router.push(`/regions/${team.slug.toLowerCase()}`);
    } else {
      router.push('/');
    }
  };

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
    { text: 'Terms', href: '/terms-of-use.pdf' },
    { text: 'Privacy Policy', href: '/privacy-policy.pdf' },
    {
      text: 'Changelog',
      href: 'https://superteamdao.notion.site/Superteam-Earn-Changelog-faf0c85972a742699ecc07a52b569827',
    },
    { text: 'Contact Us', supportForm: true },
  ];

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-start justify-between md:flex-row">
          <div className="mb-8 flex max-w-[540px] flex-col md:mb-0">
            <div className="mb-4 flex items-center">
              <LocalImage
                className="mr-4 h-6"
                alt="Superteam Earn"
                src="/assets/logo.svg"
              />
            </div>
            <p className="mb-6 text-sm text-slate-500">
              Discover high paying crypto bounties, projects and grants from the
              best Solana companies in one place and apply to them using a
              single profile.
            </p>
            <div className="flex items-center gap-4">
              <GitHub
                link="https://github.com/SuperteamDAO/earn"
                className="text-slate-500"
              />
              <Twitter
                link="https://twitter.com/superteamearn"
                className="text-slate-500"
              />
              <MdOutlineMail
                className="'transition-opacity size-5 cursor-pointer text-slate-500 opacity-100 grayscale duration-200 hover:opacity-80"
                onClick={() => {
                  window.open('mailto:support@superteam.com', '_blank');
                }}
              />
            </div>

            <div>
              <img
                alt="Powered by Solana"
                src="/assets/solana-powered.svg"
                className="mt-6 w-36"
              />
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
              <SuperteamCombobox
                placeholder="Region"
                value={selectedSuperteam}
                onChange={handleSuperteamChange}
                showGlobal
                className={cn(selectedSuperteam !== 'Global' && 'w-fit')}
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
