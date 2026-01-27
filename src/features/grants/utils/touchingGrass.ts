import type { Grant } from '../types';

export const LUMA_PREFIX = 'https://lu.ma/';
export const LUMA_LABEL = 'lu.ma/';

export function extractLumaEventSlug(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // If it's just the slug (no dots/slashes), return as-is
  if (!/[./]/.test(trimmed)) {
    return trimmed;
  }

  // Add protocol if missing
  const urlWithProtocol = trimmed.startsWith('http')
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsedUrl = new URL(urlWithProtocol);
    const hostname = parsedUrl.hostname.toLowerCase();
    const normalizedHost = hostname.replace(/^www\./, '');
    if (!['lu.ma', 'luma.com'].includes(normalizedHost)) {
      return null;
    }
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    return pathSegments[0] || null;
  } catch {
    return null;
  }
}

export function getLumaDisplayValue(value: string): string {
  if (value?.startsWith(LUMA_PREFIX)) {
    return value.slice(LUMA_PREFIX.length);
  }
  return value;
}

export const isTouchingGrassGrant = (
  grant: Grant | null | undefined,
): boolean => {
  return grant?.slug?.toLowerCase().includes('touching-grass') ?? false;
};

export const isTouchingGrassSlug = (
  slug: string | null | undefined,
): boolean => {
  return slug?.toLowerCase().includes('touching-grass') ?? false;
};

export const isUserEligibleForTouchingGrass = (
  user: {
    isPro?: boolean;
    superteamLevel?: string | null;
  } | null,
): boolean => {
  return !!(user?.isPro && user?.superteamLevel?.includes('Superteam'));
};

export const TOUCHING_GRASS_COPY = {
  application: {
    title: 'Event Grant Application',
    subtitle:
      "If you're planning to host an event that brings the Solana / Superteam community together, apply with your proposal here and we'll respond soon!",
    steps: {
      basics: 'Basics',
      details: 'Details',
      outcomes: 'Outcomes',
    },
    projectTitle: {
      label: 'Event Title',
      description: "What's the name of the event you're planning to host?",
      placeholder: 'Event Title',
    },
    projectOneLiner: {
      label: 'One-Line Summary',
      description:
        "Describe your event in one sentence (who it's for + what people will do).",
      placeholder: 'A brief summary of your event',
    },
    ask: {
      label: 'Funding Required',
      description:
        'How much funding do you need to cover reasonable expenses for this event?',
    },
    telegram: {
      label: 'Host Contact (Telegram)',
      description:
        'How can we reach you quickly if we have questions about your event?',
    },
    walletAddress: {
      label: 'Solana Wallet Address',
      description:
        'Where should we send the grant funds if your event is approved?',
    },
    projectDetails: {
      label: 'Event Details',
      description:
        'Include event format, attendee profile, and how it brings the Solana / Superteam community closer together.',
      placeholder:
        'Describe your event format, target audience, and community impact',
    },
    lumaLink: {
      label: 'Event Page (Luma)',
      description: 'Share your Luma event page link.',
      placeholder: 'your-event',
    },
    projectTimeline: {
      label: 'Event Date',
      description: 'When do you plan to host the event?',
    },
    proofOfWork: {
      label: 'Prior Event or Community Experience',
      description:
        'Share any prior experience hosting events or contributing to the community.',
      placeholder: 'Describe your relevant experience',
    },
    twitter: {
      label: 'Social Profile (X / Twitter)',
      description: 'Helpful for understanding your background and reach.',
    },
    expenseBreakdown: {
      label: 'Estimated Expense Breakdown',
      description: 'Briefly outline how you plan to use the grant funds.',
      placeholder: 'e.g., Venue: $500, Food & Drinks: $300, Marketing: $200',
    },
    milestones: {
      label: 'Expected Outcomes',
      description:
        'What do you expect to come out of this event? (attendance, onboarding, follow-ups, collaborations).',
      placeholder: 'Describe expected attendance, outcomes, and follow-ups',
    },
    acknowledgement:
      'I understand that to receive the full grant amount, I must submit event photos and scanned expense receipts.',
  },
  tranche: {
    title: 'Event Grant Tranche Request',
    subtitle:
      'Request the remaining payout for your approved event grant. Please only apply after your event has taken place.',
    description:
      'For event grants: 50% is paid upfront after KYC approval, and 50% is paid after the event upon submission of required proofs. To receive the second tranche, you must submit event photos and scanned copies of expense receipts from the event.',
    projectUpdate: {
      label: 'Event Summary & Outcomes',
      description:
        'Briefly summarize how the event went. Include who attended, and any notable outcomes or follow-ups.',
      placeholder: 'Write a short summary of the event and outcomes',
    },
    eventPictures: {
      label: 'Event Pictures',
      description: 'Upload your top five images from the event.',
    },
    eventReceipts: {
      label: 'Event Receipts',
      description: 'Upload all relevant receipts for expenses incurred.',
    },
    attendeeCount: {
      label: '# of Attendees',
      description: 'How many people attended the event?',
      placeholder: '192',
    },
    walletAddress: {
      label: 'Solana Wallet Address',
      description:
        'This field is pre-filled with the wallet address you last added for this grant project.',
    },
    socialPost: {
      label: 'Social Post',
      description:
        'Share a post about your event on a platform of your choice (X, Instagram, Youtube, Medium, Substack, etc.)',
      placeholder: 'https://x.com/...',
    },
    helpWanted: {
      label: 'Anything else?',
      description: "Mention anything else you'd like to share about the event.",
    },
    terms:
      'By submitting this payout request, you confirm that you have submitted photos and receipts for the event, and that all submitted information is accurate.',
  },
};
