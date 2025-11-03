import Link from 'next/link';

import MdOutlineMail from '@/components/icons/MdOutlineMail';
import { SupportFormDialog } from '@/components/shared/SupportFormDialog';
import { cn } from '@/utils/cn';

import { Twitter } from '@/features/social/components/SocialIcons';

import { maxW } from '../utils/styles';

type FooterLink = { href?: string; text: string; supportForm?: boolean };

const FooterColumn = ({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) => (
  <div className="flex flex-col items-start">
    <p className="mb-2 text-base font-medium text-white md:text-lg">{title}</p>
    <div className="flex flex-col space-y-2">
      {links
        .filter((s) => !!s.href)
        .map((link) => (
          <Link
            key={link.text}
            href={link.href || ''}
            className="text-sm text-slate-300 transition-colors hover:text-white md:text-base"
            target={link.href?.startsWith('http') ? '_blank' : undefined}
            rel={
              link.href?.startsWith('http') ? 'noopener noreferrer' : undefined
            }
          >
            {link.text}
          </Link>
        ))}
      {links
        .filter((s) => !!s.supportForm)
        .map((link) => (
          <SupportFormDialog key={link.text}>
            <button className="w-fit text-sm text-slate-300 transition-colors hover:text-white md:text-base">
              {link.text}
            </button>
          </SupportFormDialog>
        ))}
    </div>
  </div>
);

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const about: FooterLink[] = [
    { text: 'Pricing', href: '#pricing' },
    { text: 'Customers', href: '#trusted-by' },
    { text: 'Terms & Conditions', href: '/terms-of-use.pdf' },
    { text: 'Privacy Policy', href: '/privacy-policy.pdf' },
  ];

  const resources: FooterLink[] = [
    {
      text: 'Changelog',
      href: 'https://superteamdao.notion.site/Superteam-Earn-Changelog-faf0c85972a742699ecc07a52b569827',
    },
    {
      text: 'Rate Card',
      href: 'https://docs.google.com/spreadsheets/d/18Pahc-_9WhXezz7DW2kjwE1Iu-ExbOFtoxlPPsavsvg/edit?gid=0#gid=0',
    },
    { text: 'Contact Us', supportForm: true },
  ];

  const opportunities: FooterLink[] = [
    { text: 'Bounty', href: '/bounties' },
    { text: 'Project', href: '/projects' },
    { text: 'Grants', href: '/grants' },
  ];

  return (
    <footer className="w-full border-t border-slate-800 bg-slate-950 text-white">
      <div
        className={cn(
          'mx-auto max-w-7xl px-4 py-10',
          maxW,
          'px-[1.875rem] lg:px-[7rem] xl:px-[11rem]',
        )}
      >
        <div className="flex flex-col items-start justify-between md:flex-row">
          <div className="mb-8 flex flex-col md:mb-0">
            <div className="mb-4 flex items-center gap-4">
              <svg
                width="75"
                height="20"
                viewBox="0 0 75 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clip-path="url(#clip0_91_1061)">
                  <mask
                    id="mask0_91_1061"
                    maskUnits="userSpaceOnUse"
                    x="0"
                    y="0"
                    width="75"
                    height="20"
                  >
                    <path d="M75 0.687988H0V19.688H75V0.687988Z" fill="white" />
                  </mask>
                  <g mask="url(#mask0_91_1061)">
                    <path
                      d="M9.72222 19.688C15.0917 19.688 19.4444 15.4347 19.4444 10.188C19.4444 4.94128 15.0917 0.687988 9.72222 0.687988C4.35279 0.687988 0 4.94128 0 10.188C0 15.4347 4.35279 19.688 9.72222 19.688Z"
                      fill="#4F39F6"
                    />
                    <path
                      d="M12.7308 7.48331H14.9306V8.30757C14.9306 9.42548 13.9994 10.3291 12.8473 10.3291H12.7308V7.48331ZM9.60012 6.28613H12.7308V14.0671H12.3583C10.0889 14.0671 9.63493 12.5313 9.63493 11.1647L9.60012 6.28613ZM4.51392 8.04798C4.51392 9.43692 5.538 9.94526 6.6786 10.1146H4.51392V14.0897H6.59719C8.69226 14.0897 8.93649 13.1862 8.93649 12.3279C8.93649 11.2775 8.19172 10.5437 7.03933 10.2612H8.93649V6.28613H6.85321C4.75843 6.28613 4.51392 7.18966 4.51392 8.04798Z"
                      fill="white"
                    />
                    <path
                      d="M32.0393 16.152C30.7514 16.152 29.6282 15.8959 28.6697 15.3837C27.7113 14.8716 26.9625 14.1692 26.4235 13.2765C25.8843 12.3839 25.6147 11.3596 25.6147 10.2036C25.6147 9.31097 25.7646 8.49152 26.064 7.74521C26.3635 6.99892 26.7829 6.35507 27.322 5.81363C27.8611 5.25757 28.4975 4.8332 29.2313 4.54054C29.9801 4.23325 30.7888 4.07959 31.6574 4.07959C32.466 4.07959 33.2148 4.22593 33.9037 4.51859C34.5926 4.79662 35.1841 5.19903 35.6784 5.72583C36.1875 6.238 36.5769 6.84527 36.8464 7.54767C37.1159 8.25007 37.2358 9.01831 37.2059 9.85239L37.1834 10.8181H27.6365L27.1198 8.90856H34.5552L34.1958 9.30365V8.82076C34.1658 8.42566 34.031 8.06715 33.7914 7.74521C33.5668 7.42328 33.2747 7.17453 32.9153 6.99892C32.556 6.82333 32.1516 6.73553 31.7023 6.73553C31.0434 6.73553 30.4818 6.85991 30.0176 7.10868C29.5683 7.35744 29.2239 7.72327 28.9843 8.20616C28.7447 8.68905 28.6248 9.27439 28.6248 9.96213C28.6248 10.6645 28.7746 11.2718 29.0741 11.784C29.3886 12.2961 29.8229 12.6985 30.377 12.9912C30.946 13.2692 31.6124 13.4083 32.3762 13.4083C32.9004 13.4083 33.3796 13.3278 33.8139 13.1668C34.2482 13.0058 34.7124 12.7278 35.2066 12.3327L36.7341 14.4179C36.2998 14.7984 35.8206 15.1204 35.2964 15.3837C34.7723 15.6325 34.2332 15.8227 33.6791 15.9545C33.125 16.0861 32.5784 16.152 32.0393 16.152Z"
                      fill="white"
                    />
                    <path
                      d="M44.0106 16.152C43.0222 16.152 42.1312 15.8886 41.3375 15.3618C40.5438 14.835 39.9148 14.118 39.4505 13.2107C38.9863 12.3035 38.7542 11.2644 38.7542 10.0938C38.7542 8.92319 38.9863 7.89155 39.4505 6.99892C39.9298 6.09166 40.5737 5.38195 41.3824 4.86979C42.1911 4.34299 43.112 4.07959 44.1454 4.07959C44.7294 4.07959 45.2611 4.16739 45.7403 4.34299C46.2344 4.50396 46.6613 4.73077 47.0207 5.02344C47.3951 5.3161 47.7095 5.65266 47.9642 6.03313C48.2187 6.4136 48.3984 6.82333 48.5032 7.26233L47.8293 7.15258V4.32104H50.9967V15.9325H47.7844V13.1448L48.5032 13.079C48.3834 13.4887 48.1888 13.8765 47.9192 14.2424C47.6496 14.6082 47.3127 14.9374 46.9083 15.2301C46.519 15.5081 46.0772 15.735 45.583 15.9106C45.0889 16.0715 44.5647 16.152 44.0106 16.152ZM44.8867 13.4522C45.4857 13.4522 46.0098 13.3131 46.4591 13.0351C46.9083 12.757 47.2528 12.3693 47.4924 11.8717C47.747 11.3596 47.8742 10.7669 47.8742 10.0938C47.8742 9.43535 47.747 8.85734 47.4924 8.35981C47.2528 7.86228 46.9083 7.47451 46.4591 7.19648C46.0098 6.90381 45.4857 6.75748 44.8867 6.75748C44.3026 6.75748 43.786 6.90381 43.3367 7.19648C42.9024 7.47451 42.5579 7.86228 42.3034 8.35981C42.0488 8.85734 41.9215 9.43535 41.9215 10.0938C41.9215 10.7669 42.0488 11.3596 42.3034 11.8717C42.5579 12.3693 42.9024 12.757 43.3367 13.0351C43.786 13.3131 44.3026 13.4522 44.8867 13.4522Z"
                      fill="white"
                    />
                    <path
                      d="M54.1948 15.9325V4.32104H57.2723L57.3846 8.05251L56.8456 7.28427C57.0252 6.68431 57.3172 6.14288 57.7216 5.65998C58.1259 5.16245 58.5977 4.77467 59.1368 4.49664C59.6908 4.21861 60.2674 4.07959 60.8665 4.07959C61.121 4.07959 61.3682 4.10154 61.6078 4.14544C61.8473 4.18934 62.0495 4.24056 62.2143 4.29909L61.3607 7.72327C61.1809 7.63548 60.9638 7.56231 60.7092 7.50377C60.4546 7.43061 60.1925 7.39402 59.923 7.39402C59.5636 7.39402 59.2266 7.45987 58.9121 7.59157C58.6126 7.70863 58.3506 7.88424 58.1259 8.11837C57.9013 8.33787 57.7216 8.60125 57.5868 8.90856C57.467 9.21585 57.4071 9.55242 57.4071 9.91825V15.9325H54.1948Z"
                      fill="white"
                    />
                    <path
                      d="M64.0444 15.9325V4.32104H67.0994L67.1893 6.69163L66.5604 6.95502C66.7251 6.42823 67.0171 5.95265 67.4365 5.52829C67.8707 5.08929 68.3874 4.73808 68.9864 4.47469C69.5855 4.2113 70.2144 4.07959 70.8733 4.07959C71.7718 4.07959 72.5206 4.2552 73.1196 4.60639C73.7336 4.95759 74.1904 5.4917 74.4899 6.20873C74.8044 6.91112 74.9617 7.78179 74.9617 8.82076V15.9325H71.7718V9.0622C71.7718 8.53541 71.6969 8.09641 71.5472 7.74521C71.3975 7.39401 71.1654 7.13794 70.8508 6.97697C70.5514 6.80138 70.1769 6.72821 69.7277 6.75748C69.3682 6.75748 69.0313 6.81601 68.7168 6.93307C68.4173 7.03551 68.1553 7.18916 67.9306 7.39402C67.721 7.59889 67.5488 7.83301 67.414 8.09641C67.2942 8.35981 67.2342 8.64516 67.2342 8.95247V15.9325H65.6618C65.3174 15.9325 65.0104 15.9325 64.7408 15.9325C64.4713 15.9325 64.2392 15.9325 64.0444 15.9325Z"
                      fill="white"
                    />
                    <path
                      d="M31.0625 5.67154L32.108 1.24658L34.8146 1.85715L33.7692 6.28211L31.0625 5.67154Z"
                      fill="white"
                    />
                    <path
                      d="M27.5 18.5189L28.7197 13.3564L31.4264 13.967L30.2067 19.1295L27.5 18.5189Z"
                      fill="white"
                    />
                  </g>
                </g>
                <defs>
                  <clipPath id="clip0_91_1061">
                    <rect
                      width="75"
                      height="19"
                      fill="white"
                      transform="translate(0 0.687988)"
                    />
                  </clipPath>
                </defs>
              </svg>

              <div className="h-6 w-[1.5px] rotate-10 bg-slate-600" />
              <p className="text-sm font-medium tracking-[1.6px] text-slate-50">
                SPONSORS
              </p>
            </div>
            <p className="mb-5 max-w-sm text-lg text-slate-300">
              Superteam Earn is the largest talent marketplace on Solana.
            </p>
            <div className="flex items-center gap-4">
              <button
                className="text-slate-100 transition-opacity hover:text-white"
                onClick={() => {
                  window.open('mailto:support@superteam.com', '_blank');
                }}
                aria-label="Email"
              >
                <MdOutlineMail className="size-5" />
              </button>
              <Twitter
                link="https://twitter.com/superteamearn"
                className="text-slate-100 hover:text-white"
              />
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-6 md:w-auto md:grid-cols-3 md:gap-16">
            <FooterColumn title="About" links={about} />
            <FooterColumn title="Resources" links={resources} />
            <FooterColumn title="Opportunities" links={opportunities} />
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800 bg-white/11 py-4 pb-2 md:pb-4">
        <div
          className={cn(
            'mx-auto max-w-7xl px-4',
            maxW,
            'px-[1.875rem] lg:px-[7rem] xl:px-[11rem]',
          )}
        >
          <div className="flex flex-col items-start justify-between md:flex-row md:items-center">
            <p className="mb-3 text-sm text-slate-400 md:mb-0">
              © {currentYear} Superteam All Rights Reserved
            </p>
            <p className="hidden text-sm text-slate-400 md:block">
              Thanks for reading this far, use coupon{' '}
              <span className="font-medium text-white">FOOTERS</span> to claim a
              free BOOST
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
