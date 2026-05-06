import { isEligiblePeopleType } from '@/features/membership/utils/peopleEligibility';

import type { Grant } from '../types';

type ApplicationCopy = {
  title: string;
  subtitle: string;
  projectTitle: {
    label: string;
    description: string;
    placeholder: string;
  };
  projectOneLiner: {
    label: string;
    description: string;
    placeholder: string;
  };
  ask?: {
    label: string;
    description: string;
  };
  telegram: {
    label: string;
    description: string;
  };
  walletAddress: {
    label: string;
    description: string;
  };
  projectDetails: {
    label: string;
    description: string;
    placeholder: string;
  };
  lumaLink?: {
    label: string;
    description: string;
    placeholder: string;
  };
  proofOfWork: {
    label: string;
    description: string;
    placeholder: string;
  };
  twitter: {
    label: string;
    description: string;
  };
  github?: {
    label: string;
    description: string;
  };
  expenseBreakdown?: {
    label: string;
    description: string;
    placeholder: string;
  };
  projectTimeline?: {
    label: string;
    description: string;
  };
  milestones: {
    label: string;
    description: string;
    placeholder: string;
  };
  kpi?: {
    label: string;
    description: string;
    placeholder: string;
  };
  acknowledgement: string;
};

type TrancheCopy = {
  title: string;
  subtitle: string;
  description?: string;
  projectUpdate?: {
    label: string;
    description: string;
    placeholder: string;
  };
  eventPictures?: {
    label: string;
    description: string;
  };
  eventReceipts?: {
    label: string;
    description: string;
  };
  attendeeCount?: {
    label: string;
    description: string;
    placeholder: string;
  };
  colosseumLink?: {
    label: string;
    description: string;
    placeholder: string;
  };
  githubRepo?: {
    label: string;
    description: string;
    placeholder: string;
  };
  aiReceipt?: {
    label: string;
    description: string;
  };
  walletAddress: {
    label: string;
    description: string;
  };
  socialPost?: {
    label: string;
    description: string;
    placeholder: string;
  };
  helpWanted: {
    label: string;
    description: string;
  };
  terms: string;
};

export const LUMA_PREFIX = 'https://lu.ma/';
export const LUMA_LABEL = 'lu.ma/';
export const COLOSSEUM_ARENA_PREFIX = 'https://arena.colosseum.org/';
export const COLOSSEUM_ARENA_LABEL = 'arena.colosseum.org/';
export const GITHUB_REPO_PREFIX = 'https://github.com/';
export const GITHUB_REPO_LABEL = 'github.com/';
export const AGENTIC_ENGINEERING_FIXED_ASK = 200;
export const COINDCX_GRANT_ID = 'c72940f7-81ae-4c03-9bfe-9979d4371267';

export function extractLumaEventSlug(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  if (!/[./]/.test(trimmed)) {
    return trimmed;
  }

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

function extractHostedPath(
  input: string,
  {
    prefix,
    hosts,
    minSegments = 1,
  }: {
    prefix: string;
    hosts: string[];
    minSegments?: number;
  },
): string | null {
  if (!input) return null;

  const trimmed = input.trim();
  const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
  const normalizedInput =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `${normalizedPrefix}${trimmed.replace(/^\/+/, '')}`;

  try {
    const url = new URL(normalizedInput);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');

    if (!hosts.includes(hostname)) {
      return null;
    }

    const path = `${url.pathname}${url.search}${url.hash}`.replace(/^\/+/, '');
    const pathSegments = url.pathname.split('/').filter(Boolean);
    if (pathSegments.length < minSegments) {
      return null;
    }

    return path;
  } catch {
    return null;
  }
}

export function extractArenaColosseumPath(input: string): string | null {
  return extractHostedPath(input, {
    prefix: COLOSSEUM_ARENA_PREFIX,
    hosts: ['arena.colosseum.org'],
  });
}

export function getArenaColosseumDisplayValue(value: string): string {
  if (!value) return '';
  if (value.startsWith(COLOSSEUM_ARENA_PREFIX)) {
    return value.slice(COLOSSEUM_ARENA_PREFIX.length).replace(/^\/+/, '');
  }
  return value.replace(/^\/+/, '');
}

export function extractGithubRepoPath(input: string): string | null {
  return extractHostedPath(input, {
    prefix: GITHUB_REPO_PREFIX,
    hosts: ['github.com'],
    minSegments: 2,
  });
}

export function getGithubRepoDisplayValue(value: string): string {
  if (!value) return '';
  if (value.startsWith(GITHUB_REPO_PREFIX)) {
    return value.slice(GITHUB_REPO_PREFIX.length).replace(/^\/+/, '');
  }
  return value.replace(/^\/+/, '');
}

export const isSTGrant = (grant: Grant | null | undefined): boolean => {
  return grant?.isST === true;
};

export const isAgenticEngineeringGrant = (
  grant: { title?: string | null } | null | undefined,
): boolean => {
  return grant?.title?.toLowerCase().includes('agentic engineering') ?? false;
};

export const getGrantFixedAsk = (
  grant:
    | {
        title?: string | null;
        minReward?: number | null;
        maxReward?: number | null;
      }
    | null
    | undefined,
): number | null => {
  if (!grant || !isAgenticEngineeringGrant(grant)) {
    return null;
  }

  if (
    typeof grant.minReward === 'number' &&
    typeof grant.maxReward === 'number' &&
    grant.minReward === grant.maxReward
  ) {
    return grant.minReward;
  }

  return AGENTIC_ENGINEERING_FIXED_ASK;
};

export const isUserEligibleForST = (
  user: {
    peopleId?: string | null;
    people?: {
      chapterId?: string | null;
      type?: string | null;
    } | null;
  } | null,
): boolean => {
  if (!user?.people || !isEligiblePeopleType(user.people.type)) {
    return false;
  }
  return Boolean(user.peopleId || user.people.chapterId);
};

export const ST_GRANT_COPY: {
  application: ApplicationCopy;
  tranche: TrancheCopy;
} = {
  application: {
    title: 'Event Grant Application',
    subtitle:
      "If you're looking to host an event that will help Solana's or Superteam's ecosystem grow, apply with your proposal here and we'll respond soon!",
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

export const AGENTIC_ENGINEERING_GRANT_COPY: {
  application: ApplicationCopy;
  tranche: TrancheCopy;
} = {
  application: {
    title: 'Agentic Engineering Grant Application',
    subtitle: `Share your Agentic Engineering project plan and the strongest proof that you can ship it fast. The grant amount is fixed at ${AGENTIC_ENGINEERING_FIXED_ASK} USDG.`,
    projectTitle: {
      label: 'Project Title',
      description: 'What should we call your project?',
      placeholder: 'Project Title',
    },
    projectOneLiner: {
      label: 'One Line Description',
      description: 'Describe your project in one line.',
      placeholder: 'A concise one-line description',
    },
    telegram: {
      label: 'TG username',
      description: 'How can we reach you quickly if we have questions?',
    },
    walletAddress: {
      label: 'Wallet Address',
      description: 'Where should the grant funds be sent if you are approved?',
    },
    projectDetails: {
      label: 'Project Details',
      description: 'Describe the problem statement and your proposed solution.',
      placeholder: 'Describe the problem statement and your solution',
    },
    projectTimeline: {
      label: 'Deadline',
      description: 'What is the target deadline for shipping this project?',
    },
    proofOfWork: {
      label: 'Proof of Work',
      description:
        'Share prior work, demos, shipped agents, or anything else that proves you can execute.',
      placeholder: 'Share links and context for your strongest proof of work',
    },
    twitter: {
      label: 'Personal X Profile',
      description: 'Helpful for understanding your background and public work.',
    },
    github: {
      label: 'Personal Github Profile',
      description: 'Optional, but helpful if you build in public or ship code.',
    },
    milestones: {
      label: 'Goals and Milestones',
      description:
        'List the goals and milestones you plan to hit before the deadline.',
      placeholder: 'Outline the milestones you plan to complete',
    },
    kpi: {
      label: 'Primary KPI',
      description:
        'What is the single main metric that will indicate whether this project succeeded?',
      placeholder: 'Define the primary KPI for success',
    },
    acknowledgement:
      'I understand that to receive the final tranche, I must submit the Colosseum project link, GitHub repo, and my AI subscription receipt.',
  },
  tranche: {
    title: 'Final Tranche Request',
    subtitle:
      'Submit the final proofs for your Agentic Engineering grant to unlock the second tranche.',
    description:
      'Share your project URL, GitHub repository, AI subscription receipt, payout wallet, and anything else that will help the sponsor review the final tranche.',
    colosseumLink: {
      label: "Link to your project's URL",
      description: 'URL that showcases your project',
      placeholder: 'https://your-project-url.com',
    },
    githubRepo: {
      label: 'Link to the Github Repo',
      description:
        'If the repo is private, share access with abhwshek@gmail.com.',
      placeholder: 'owner/repo',
    },
    aiReceipt: {
      label: 'Upload your AI Subscription Receipt',
      description:
        'The receipt should mention your name or entity, and total to at least $200. Upload up to 3 PDFs or PNGs.',
    },
    walletAddress: {
      label: 'Solana Wallet Address',
      description:
        'This field is pre-filled with the wallet address you last added for this grant project.',
    },
    helpWanted: {
      label: 'Anything Else?',
      description:
        'Share anything else that will help the sponsor review this payout request.',
    },
    terms:
      'By submitting this payout request, you confirm that the links and receipt are accurate and belong to this project.',
  },
};
