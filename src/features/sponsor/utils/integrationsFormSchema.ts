import axios from 'axios';
import { z } from 'zod';

import {
  extractDaoFromTreasury,
  isNearnIoRequestor,
  NEAR_ACCOUNT,
} from '@/utils/near';
import { getURL } from '@/utils/validUrl';

export const nearTreasuryFormSchema = z
  .object({
    nearTreasuryFrontend: z
      .string()
      .nullable()
      .refine(
        (value) =>
          !value ||
          value.endsWith('.near.page') ||
          value.startsWith('https://near.social/') ||
          value.startsWith('near.social/') ||
          value.startsWith('https://dev.near.org/') ||
          value.startsWith('dev.near.org/'),
        {
          message:
            'Please provide a valid NEAR Treasury Link. (near.page, near.social, dev.near.org)',
        },
      )
      .transform((value) => value?.replace('https://', '') ?? null),
  })
  .transform(async (data) => {
    let accountId;
    if (data.nearTreasuryFrontend?.startsWith('near.social/')) {
      accountId = data.nearTreasuryFrontend?.slice(12).split('/')[0];
    } else if (data.nearTreasuryFrontend?.startsWith('dev.near.org/')) {
      accountId = data.nearTreasuryFrontend?.slice(13).split('/')[0];
    } else {
      accountId = data.nearTreasuryFrontend?.split('.page')[0];
    }
    return {
      nearTreasuryFrontend: data.nearTreasuryFrontend
        ? accountId + '.page'
        : null,
      nearTreasuryDao: data.nearTreasuryFrontend
        ? await extractDaoFromTreasury(accountId!)
        : null,
    };
  })
  .superRefine(async (data, ctx) => {
    if (!!data.nearTreasuryFrontend && !data.nearTreasuryDao) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Could not extract DAO from Near Treasury. Did you provide the correct URL?`,
        path: ['nearTreasuryFrontend'],
      });
    }

    if (!!data.nearTreasuryFrontend && data.nearTreasuryDao) {
      const {
        data: { available },
      } = await axios.get<{ available: boolean }>(
        `${getURL()}/api/sponsors/check-near-treasury?dao=${data.nearTreasuryDao}`,
      );
      if (!available) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Sputnik DAO is already connected to another sponsor and not available`,
          path: ['nearTreasuryFrontend'],
        });
      }
    }

    if (!!data.nearTreasuryFrontend && data.nearTreasuryDao) {
      const isRequestor = await isNearnIoRequestor(data.nearTreasuryDao);
      if (!isRequestor) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${NEAR_ACCOUNT} doesn't have rights to add proposals in the provided NEAR Treasury`,
          path: ['nearTreasuryFrontend'],
        });
      }
    }
  });

export type NearTreasuryFormValues = z.infer<typeof nearTreasuryFormSchema>;
