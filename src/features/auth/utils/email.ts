import axios from 'axios';

import { emailRegex } from '@/features/talent';

export const checkEmailValidity = async (email: string) => {
  try {
    const { data } = await axios.post('/api/email/validate', { email });
    return data.isValid;
  } catch (error) {
    console.error('Error checking email validity:', error);
    return false;
  }
};

export const validateEmailRegex = (emailAddress: string) => {
  const emailLower = emailAddress.toLowerCase();

  const providers = [
    'gmail.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'protonmail.com',
    'proton.me',
    'mail.com',
    'skiff.com',
  ];

  const typos: Record<string, string[]> = {
    gmail: [
      'gmal',
      'gmial',
      'gmali',
      'gmaul',
      'gnail',
      'gmailcom',
      'gmai',
      'gmil',
      'gmale',
      'gmall',
      'gmile',
      'gmaill',
      'gmaiil',
      'gmaill',
      'gamil',
      'gemail',
      'ggmail',
      'gmain',
      'gmaio',
      'gmeil',
      'gmial',
      'gmiil',
      'gmil',
      'gmsil',
      'gmqil',
      'gmzil',
      'gmakl',
      'gmaol',
      'gmcil',
      'gmzil',
      'gmqil',
      'gmwil',
      'gmaik',
    ],
    hotmail: [
      'hotmal',
      'hotmai',
      'hotmial',
      'hotmale',
      'hotmmail',
      'hotmailcom',
      'hitmail',
      'hormail',
      'homail',
      'hotmai',
      'hotmil',
      'hotmall',
      'hotmaul',
      'hotmial',
      'hotmil',
      'hotmqil',
      'hotmzil',
      'hoymail',
      'hptmail',
      'htmail',
      'htomail',
      'hhotmail',
      'homtail',
      'hotnail',
      'hotmaol',
      'hotmial',
    ],
    outlook: [
      'outlok',
      'outloo',
      'outllok',
      'outoook',
      'outlookcom',
      'outlock',
      'outlooc',
      'outlool',
      'outloook',
      'outlook',
      'outloog',
      'outoolk',
      'outlouk',
      'putlook',
      'ouylook',
      'oytlook',
      'outllook',
      'outloik',
      'outlokk',
      'outpook',
      'iutlook',
      'oitlook',
      'outliok',
      'outloik',
    ],
    icloud: [
      'iclod',
      'icloude',
      'iclould',
      'icloudcom',
      'icoud',
      'iclod',
      'iclou',
      'icluod',
      'icloud',
      'iclouf',
      'iclous',
      'icliud',
      'iclpud',
      'ickoud',
      'icloid',
      'icluod',
      'icould',
      'icolud',
      'iclud',
      'icoud',
      'iclkud',
      'iclpud',
    ],
    protonmail: [
      'protonmal',
      'protonmai',
      'protonmial',
      'protonmailcom',
      'protonmil',
      'protonmial',
      'potonmail',
      'ptotonmail',
      'protnomail',
      'protommail',
      'protonmial',
      'protonmaill',
      'protonmaik',
      'protonmall',
      'protomail',
      'protonmale',
      'protonmil',
      'protonnail',
      'protonmain',
    ],
    skiff: [
      'skif',
      'skiffcom',
      'skif',
      'skif',
      'skifff',
      'skift',
      'skigf',
      'skigg',
      'skifg',
      'skivf',
      'skigf',
      'skuf',
      'skifmail',
    ],
    mail: [
      'mial',
      'mailcom',
      'mal',
      'maill',
      'meil',
      'maik',
      'mail',
      'maiil',
      'maiol',
      'mailk',
      'maail',
      'msil',
      'mil',
      'meil',
      'mqil',
      'maol',
    ],
  };

  const [, domain] = emailLower.split('@');

  if (!emailRegex.test(emailLower) || !domain) {
    return false;
  }

  if (providers.includes(domain)) {
    return true;
  }

  for (const [provider, providerTypos] of Object.entries(typos)) {
    const providerDomain = `${provider}.com`;
    if (domain === providerDomain) {
      return true;
    }
    if (
      providerTypos.some((typo) => domain === typo || domain === `${typo}.com`)
    ) {
      return false;
    }
  }

  return true;
};
