import { type SponsorType } from '@/interface/sponsor';

export function prepareCompanyInfo(sponsor: SponsorType) {
  return `
    name: ${sponsor.name}
    url: ${sponsor.url}
    industry: ${sponsor.industry}
    twitter: ${sponsor.twitter}
    bio: ${sponsor.bio}
  `;
}
