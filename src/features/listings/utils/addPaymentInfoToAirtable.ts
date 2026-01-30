import axios from 'axios';
import lookup from 'country-code-lookup';
import { z } from 'zod';

import { Superteams } from '@/constants/Superteam';
import logger from '@/lib/logger';
import {
  airtableConfig,
  airtableInsert,
  airtableUrl,
  fetchAirtableRecordId,
} from '@/utils/airtable';
import { getRankLabels } from '@/utils/rank';
import { safeStringify } from '@/utils/safeStringify';

const AirtableInputSchema = z.object({
  submission: z.object({
    id: z.string(),
    winnerPosition: z.number(),
    user: z.object({
      email: z.string().email(),
      username: z.string(),
      location: z.string().nullable(),
      walletAddress: z.string().min(1, 'Wallet address is required'),
      kycName: z.string().min(1, 'KYC Name is required'),
      kycAddress: z.string().nullable(),
      kycDOB: z.string().min(1, 'KYC Date of Birth is required'),
      kycIDNumber: z.string().min(1, 'KYC ID Number is required'),
      kycIDType: z.string().min(1, 'KYC ID Type is required'),
      kycCountry: z
        .string()
        .length(3, 'KYC Country must be a 3-letter ISO code')
        .refine((val) => lookup.byIso(val), {
          message: 'Invalid KYC Country ISO code',
        }),
    }),
    listing: z.object({
      id: z.string(),
      title: z.string().min(1, 'Listing Title is required'),
      rewards: z.record(z.string(), z.number()),
      type: z.enum(['bounty', 'hackathon']),
      slug: z.string().min(1, 'Listing Slug is required'),
    }),
  }),
});

type ValidatedInput = z.infer<typeof AirtableInputSchema>;
type ValidatedSubmission = ValidatedInput['submission'];

interface PaymentAirtableSchema {
  Name: string;
  Address: string;
  'Date of Birth': string;
  'ID Number': string;
  'ID Type': string;
  'Country of Residence': string;
  Amount: number;
  'Wallet Address': string;
  Category: string[];
  'Purpose of Payment': string;
  'Project (Archive)': string;
  Email: string;
  Status: string;
  Region?: string[];
  Approver: string[];
  earnApplicationId: string;
  'Discord / Earn Username': string;
}

function submissionToAirtable(
  validatedSubmission: ValidatedSubmission,
  listingRegionId: string,
): PaymentAirtableSchema {
  const country = lookup.byIso(validatedSubmission.user.kycCountry)?.country;
  logger.debug(
    `Looked up country for ISO '${validatedSubmission.user.kycCountry}': ${country ?? 'Not found'}`,
  );

  const rank = getRankLabels(validatedSubmission.winnerPosition)?.toUpperCase();
  const listingUrl =
    'https://superteam.fun/earn/listing/' + validatedSubmission.listing.slug;
  const listingTitle = validatedSubmission.listing.title;

  const purposeOfPayment =
    rank +
    ' in ' +
    listingTitle +
    ' (' +
    listingUrl +
    ') — ' +
    validatedSubmission.user.email;

  const amount =
    validatedSubmission.listing.rewards[validatedSubmission.winnerPosition];

  const getListingCategory = () => {
    const isProd = process.env.VERCEL_ENV === 'production';
    const listingType = validatedSubmission.listing.type.toLowerCase();

    switch (listingType) {
      case 'bounty':
        return isProd ? 'recVJBMFEtm3Fj4Rg' : 'rec3Z9YjIC94bWD1n';
      case 'hackathon':
        return isProd ? 'rec03uWVyyixPpSVM' : 'rec8j28zCH5yl2r5T';
      default: {
        throw new Error(`Unhandled listing type: ${listingType}`);
      }
    }
  };

  const paymentData: PaymentAirtableSchema = {
    Name: validatedSubmission.user.kycName,
    Address: validatedSubmission.user.kycAddress ?? '',
    'Date of Birth': validatedSubmission.user.kycDOB,
    'ID Number': validatedSubmission.user.kycIDNumber,
    'ID Type': validatedSubmission.user.kycIDType,
    'Country of Residence': country || validatedSubmission.user.kycCountry,
    Amount: amount ?? 0,
    'Wallet Address': validatedSubmission.user.walletAddress,
    Category: [getListingCategory()],
    'Purpose of Payment': purposeOfPayment || 'Listing Payment',
    'Project (Archive)': listingTitle ?? '',
    Email: validatedSubmission.user.email,
    Status: 'Verified',
    Region: [listingRegionId],
    Approver: ['Pratik Dholani'],
    earnApplicationId: validatedSubmission.id,
    'Discord / Earn Username': validatedSubmission.user.username,
  };

  logger.debug(
    `Mapped data for Airtable payment record (Submission ID: ${validatedSubmission.id}): ${safeStringify(paymentData)}`,
  );
  return paymentData;
}

export async function addPaymentInfoToAirtable(
  inputSubmission: ValidatedSubmission,
) {
  const submissionIdForLogging = inputSubmission?.id ?? 'unknown';
  const listingIdForLogging = inputSubmission?.listing?.id ?? 'unknown';
  logger.info(
    `Starting addPaymentInfoToAirtable for Submission ID: ${submissionIdForLogging}, Listing ID: ${listingIdForLogging}`,
  );

  logger.debug(
    `Validating input data for Submission ID: ${submissionIdForLogging}`,
  );
  const validationResult = AirtableInputSchema.safeParse({
    submission: inputSubmission,
  });

  if (!validationResult.success) {
    const errorMessages = validationResult.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('; ');
    logger.error(
      `Input validation failed for addPaymentInfoToAirtable (Submission ID: ${submissionIdForLogging}). Errors: ${errorMessages}`,
      { validationErrors: validationResult.error.format() },
    );
    throw new Error(
      `Invalid input data for Airtable payment info: ${errorMessages}`,
    );
  }

  const { submission } = validationResult.data;
  const { id: validatedSubmissionId } = submission;
  logger.info(
    `Input validation successful for Submission ID: ${validatedSubmissionId}`,
  );

  try {
    logger.debug(`Checking Airtable environment variables.`);
    const airtableApiKey = process.env.AIRTABLE_GRANTS_API_TOKEN;
    const paymentsBaseId = process.env.AIRTABLE_PAYMENTS_BASE_ID;
    const paymentsTable = process.env.AIRTABLE_PAYMENTS_TABLE_NAME;
    const regionsTable = process.env.AIRTABLE_PAYMENTS_REGIONS_TABLE_NAME;

    if (!airtableApiKey || !paymentsBaseId || !paymentsTable || !regionsTable) {
      const missingVars = [
        !airtableApiKey && 'AIRTABLE_GRANTS_API_TOKEN',
        !paymentsBaseId && 'AIRTABLE_PAYMENTS_BASE_ID',
        !paymentsTable && 'AIRTABLE_PAYMENTS_TABLE_NAME',
        !regionsTable && 'AIRTABLE_PAYMENTS_REGIONS_TABLE_NAME',
      ]
        .filter(Boolean)
        .join(', ');
      logger.error(
        `Airtable environment variables are missing: ${missingVars}. Cannot proceed with Airtable operation for Submission ID: ${validatedSubmissionId}.`,
      );
      throw new Error(
        `Airtable configuration is incomplete. Missing: ${missingVars}`,
      );
    }
    logger.debug('Airtable environment variables check passed.');

    const grantsAirtableConfig = airtableConfig(airtableApiKey);
    const paymentsAirtableURL = airtableUrl(paymentsBaseId, paymentsTable);
    const paymentsRegionAirtableURL = airtableUrl(paymentsBaseId, regionsTable);

    logger.info(
      `Checking for existing Airtable payment record for Submission ID: ${validatedSubmissionId} using formula.`,
    );
    const filterFormula = `AND({earnApplicationId}='${submission.id}')`;
    const existingRecordId = await fetchAirtableRecordId(
      paymentsAirtableURL,
      null,
      null,
      grantsAirtableConfig,
      filterFormula,
    );

    if (existingRecordId) {
      logger.warn(
        `Airtable payment record already exists for Submission ID: ${validatedSubmissionId} (Record ID: ${existingRecordId}). Skipping creation.`,
      );
      return {
        message: 'Record already exists',
        records: [{ id: existingRecordId }],
      };
    }
    logger.info(
      `No existing Airtable payment record found for Submission ID: ${validatedSubmissionId}. Proceeding with creation.`,
    );

    logger.info(
      `Determining region and fetching Airtable Region ID for Submission ID: ${validatedSubmissionId}`,
    );
    const superteam = Superteams.find(
      (s) =>
        s.country.some(
          (c) => c.toLowerCase() === submission.user.location?.toLowerCase(),
        ) || s.region === submission.user.location,
    );

    const regionName = superteam ? superteam.region : 'Global';

    logger.info(
      `Determined region name: '${regionName}' based on user location: '${submission.user.location ?? 'N/A'}' for Submission ID: ${validatedSubmissionId}`,
    );

    const regionRecordId = await fetchAirtableRecordId(
      paymentsRegionAirtableURL,
      'Country',
      regionName,
      grantsAirtableConfig,
    );

    if (!regionRecordId) {
      const regionErrorMessage = `Failed to find Airtable Region Record ID for region name: '${regionName}' (Submission ID: ${validatedSubmissionId}). Check if '${regionName}' exists in the '${regionsTable}' table's 'Country' field.`;
      logger.error(regionErrorMessage);
      throw new Error(
        `Could not find required Airtable region record for '${regionName}'. Payment cannot be processed without region link.`,
      );
    }
    logger.info(
      `Found Airtable Region ID: ${regionRecordId} for region name: '${regionName}' (Submission ID: ${validatedSubmissionId})`,
    );

    logger.debug(
      `Mapping submission and listing data to Airtable schema for Submission ID: ${validatedSubmissionId}`,
    );
    const airtableData = submissionToAirtable(submission, regionRecordId);

    logger.info(
      `Attempting to add payment info to Airtable for Submission ID: ${validatedSubmissionId}`,
      safeStringify(airtableData),
    );

    const airtablePayload = airtableInsert([{ fields: airtableData }], true);
    logger.debug(
      `Prepared Airtable payload for Submission ID: ${validatedSubmissionId}: ${safeStringify(airtablePayload)}`,
    );

    logger.info(
      `Attempting to POST payment info to Airtable for Submission ID: ${validatedSubmissionId}`,
    );
    const response = await axios.post(
      paymentsAirtableURL,
      JSON.stringify(airtablePayload),
      grantsAirtableConfig,
    );

    const createdRecordId = response.data?.records?.[0]?.id;
    if (createdRecordId) {
      logger.info(
        `Successfully added payment info to Airtable for Submission ID: ${validatedSubmissionId}. New Record ID: ${createdRecordId}`,
      );
    } else {
      logger.warn(
        `Airtable API call succeeded for Submission ID: ${validatedSubmissionId}, but could not extract new Record ID from response. Status: ${response.status}. Response data: ${safeStringify(response.data)}`,
      );
    }

    return response.data;
  } catch (error: any) {
    const baseMessage = `Error in addPaymentInfoToAirtable for Submission ID ${validatedSubmissionId || submissionIdForLogging}: ${error.message || 'Unknown error'}`; // Use validated ID if available

    logger.error(baseMessage);

    if (error.response) {
      logger.error(
        `Airtable API Error Response: ${safeStringify(error.response.data)}`,
      );
      logger.error(`Airtable API Error Status: ${error.response.status}`);
      logger.error(
        `Airtable API Error Headers: ${safeStringify(error.response.headers)}`,
      );
    } else if (error.request) {
      logger.error(
        `Airtable API No Response Received (Network Error?): ${safeStringify(error.request)}`,
      );
    } else if (error instanceof z.ZodError) {
      logger.error(
        `Input Validation Error Details: ${safeStringify(error.errors)}`,
      );
    } else {
      logger.error(`Non-API Error Details: ${safeStringify(error)}`);
      if (error.stack) {
        logger.error(`Stack trace: ${error.stack}`);
      }
    }

    throw new Error(`${baseMessage} - Check server logs for more details.`);
  }
}
