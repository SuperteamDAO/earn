import { type GrantApplication, type GrantTranche } from '@prisma/client';
import axios from 'axios';
import lookup from 'country-code-lookup';
import { z } from 'zod';

import { Superteams } from '@/constants/Superteam';
import {
  airtableConfig,
  airtableInsert,
  airtableUrl,
  fetchAirtableRecordId,
} from '@/utils/airtable';
import { safeStringify } from '@/utils/safeStringify';

const AirtableInputSchema = z.object({
  application: z.object({
    id: z.string(),
    walletAddress: z
      .string()
      .min(1, 'Wallet address cannot be empty')
      .regex(
        /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
        'Invalid Solana wallet address format',
      ),
    projectOneLiner: z.string().optional(),
    user: z.object({
      email: z.string().email(),
      location: z.string().nullable(),
      kycName: z.string().min(1, 'KYC Name is required'),
      kycAddress: z.string().min(1, 'KYC Address is required'),
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
    grant: z.object({
      airtableId: z.string().nullable(),
      approverRecordId: z.string().min(1, 'Approver Record ID is required'),
    }),
  }),
  grantTranche: z.object({
    id: z.string(),
    approvedAmount: z.number().positive('Approved amount must be positive'),
    status: z.literal('Approved', {
      errorMap: () => ({
        message: "Tranche status must be 'Approved' to add payment info",
      }),
    }),
  }),
});

type ValidatedInput = z.infer<typeof AirtableInputSchema>;
type ValidatedApplication = ValidatedInput['application'];
type ValidatedGrantTranche = ValidatedInput['grantTranche'];

interface GrantApplicationWithUserAndGrant extends GrantApplication {
  grant: {
    airtableId: string | null;
    approverRecordId: string | null;
  };
  user: {
    email: string;
    location: string | null;
    kycName: string | null;
    kycAddress: string | null;
    kycDOB: string | null;
    kycIDNumber: string | null;
    kycIDType: string | null;
    kycCountry: string | null;
  };
}

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
  Email: string;
  Status: string;
  Region?: string[];
  Approver: string[];
  earnApplicationId: string;
  earnTrancheId: string;
}

const grantCategory =
  process.env.NODE_ENV === 'production'
    ? 'recd0Kn3N4Ffhtwhd'
    : 'rec5KcbpJVSeLQX76';

function grantApplicationToAirtable(
  validatedApplication: ValidatedApplication,
  grantRegionId: string,
  validatedGrantTranche: ValidatedGrantTranche,
): PaymentAirtableSchema {
  const country = lookup.byIso(validatedApplication.user.kycCountry)?.country;
  return {
    Name: validatedApplication.user.kycName,
    Address: validatedApplication.user.kycAddress,
    'Date of Birth': validatedApplication.user.kycDOB,
    'ID Number': validatedApplication.user.kycIDNumber,
    'ID Type': validatedApplication.user.kycIDType,
    'Country of Residence': country || validatedApplication.user.kycCountry,
    Amount: validatedGrantTranche.approvedAmount,
    'Wallet Address': validatedApplication.walletAddress,
    Category: [grantCategory],
    'Purpose of Payment':
      validatedApplication.projectOneLiner || 'Grant Payment',
    Email: validatedApplication.user.email,
    Status: 'Verified',
    Region: [grantRegionId],
    Approver: [validatedApplication.grant.approverRecordId],
    earnApplicationId: validatedApplication.id,
    earnTrancheId: validatedGrantTranche.id,
  };
}

export async function addPaymentInfoToAirtable(
  inputApplication: GrantApplicationWithUserAndGrant,
  inputGrantTranche: GrantTranche,
) {
  const trancheIdForLogging = inputGrantTranche?.id ?? 'unknown';

  const validationResult = AirtableInputSchema.safeParse({
    application: inputApplication,
    grantTranche: inputGrantTranche,
  });

  if (!validationResult.success) {
    const errorMessages = validationResult.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('; ');
    const errorMessage = `Input validation failed for addPaymentInfoToAirtable (Tranche ID: ${trancheIdForLogging}): ${errorMessages}`;
    console.error(errorMessage);
    throw new Error(
      `Invalid input data for Airtable payment info: ${errorMessages}`,
    );
  }

  const { application, grantTranche } = validationResult.data;
  const { id: validatedTrancheId } = grantTranche;

  try {
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
      console.error(
        `Airtable environment variables are missing: ${missingVars}`,
      );
      throw new Error('Airtable configuration is incomplete.');
    }

    const grantsAirtableConfig = airtableConfig(airtableApiKey);
    const paymentsAirtableURL = airtableUrl(paymentsBaseId, paymentsTable);
    const paymentsRegionAirtableURL = airtableUrl(paymentsBaseId, regionsTable);

    console.log(
      `Checking for existing Airtable payment record for Tranche ID: ${validatedTrancheId}`,
    );
    const filterFormula = `AND({earnApplicationId}='${application.id}', {earnTrancheId}='${validatedTrancheId}')`;
    const existingRecordId = await fetchAirtableRecordId(
      paymentsAirtableURL,
      null,
      null,
      grantsAirtableConfig,
      filterFormula,
    );

    if (existingRecordId) {
      console.warn(
        `Airtable payment record already exists for Tranche ID: ${validatedTrancheId} (Record ID: ${existingRecordId}). Skipping creation.`,
      );
      return {
        message: 'Record already exists',
        records: [{ id: existingRecordId }],
      };
    }
    console.log(
      `No existing Airtable payment record found for Tranche ID: ${validatedTrancheId}. Proceeding with creation.`,
    );

    console.log(
      `Fetching Airtable Region ID for Tranche ID: ${validatedTrancheId}`,
    );
    const superteam = Superteams.find(
      (s) =>
        s.country.some(
          (c) => c.toLowerCase() === application.user.location?.toLowerCase(),
        ) || s.region === application.user.location,
    );

    const regionName = superteam
      ? superteam.airtableKey || superteam.displayValue
      : 'Global';

    console.log(
      `Determined region name: '${regionName}' for location: ${application.user.location ?? 'N/A'}`,
    );

    const regionRecordId = await fetchAirtableRecordId(
      paymentsRegionAirtableURL,
      'Country',
      regionName,
      grantsAirtableConfig,
    );

    if (!regionRecordId) {
      const regionErrorMessage = `Failed to find Airtable Region Record ID for region name: '${regionName}' (Tranche ID: ${validatedTrancheId})`;
      console.error(regionErrorMessage);
      throw new Error(
        `Could not find required Airtable region record for '${regionName}'.`,
      );
    }
    console.log(
      `Found Airtable Region ID: ${regionRecordId} for region name: '${regionName}'`,
    );

    const airtableData = grantApplicationToAirtable(
      application,
      regionRecordId,
      grantTranche,
    );

    console.log(
      `Attempting to add payment info to Airtable for Tranche ID: ${validatedTrancheId}`,
      safeStringify(airtableData),
    );

    const airtablePayload = airtableInsert([{ fields: airtableData }], true);

    const response = await axios.post(
      paymentsAirtableURL,
      JSON.stringify(airtablePayload),
      grantsAirtableConfig,
    );

    const createdRecordId = response.data?.records?.[0]?.id;
    if (createdRecordId) {
      console.log(
        `Successfully added payment info to Airtable for Tranche ID: ${validatedTrancheId}. New Record ID: ${createdRecordId}`,
      );
    } else {
      console.warn(
        `Airtable API call succeeded for Tranche ID: ${validatedTrancheId}, but could not extract new Record ID from response:`,
        safeStringify(response.data),
      );
    }

    return response.data;
  } catch (error: any) {
    const baseMessage = `Error in addPaymentInfoToAirtable for Tranche ID ${validatedTrancheId}: ${error.message || 'Unknown error'}`;

    console.error(baseMessage);

    if (error.response) {
      console.error(
        `Airtable API Error Response: ${safeStringify(error.response.data)}`,
      );
      console.error(`Airtable API Error Status: ${error.response.status}`);
      console.error(
        `Airtable API Error Headers: ${safeStringify(error.response.headers)}`,
      );
    } else if (error.request) {
      console.error(
        `Airtable API No Response Received (Network Error?): ${safeStringify(error.request)}`,
      );
    } else if (error instanceof z.ZodError) {
      console.error(
        `Input Validation Error Details: ${safeStringify(error.errors)}`,
      );
    } else {
      console.error(`Non-API Error Details: ${safeStringify(error)}`);
      if (error.stack) {
        console.error(`Stack trace: ${error.stack}`);
      }
    }

    throw new Error(`${baseMessage} - Check server logs for more details.`);
  }
}
