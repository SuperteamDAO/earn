import { type GrantApplication } from '@prisma/client';
import axios from 'axios';

import { Superteams } from '@/constants/Superteam';
import {
  airtableConfig,
  airtableInsert,
  airtableUrl,
  fetchAirtableRecordId,
} from '@/utils/airtable';
import { safeStringify } from '@/utils/safeStringify';

interface GrantApplicationWithUserAndGrant extends GrantApplication {
  grant: {
    airtableId: string | null;
  };
  user: {
    email: string;
    location: string | null;
  };
}

interface PaymentAirtableSchema {
  Name: string;
  Amount: number;
  'Wallet Address': string;
  Category: string[];
  'Purpose of Payment': string;
  Status: string;
  Region?: string[];
}

export function grantApplicationToAirtable(
  grantApplication: GrantApplicationWithUserAndGrant,
  grantRegionId: string,
): PaymentAirtableSchema {
  return {
    Name: `${grantApplication.kycName || ''}`,
    Amount: grantApplication.approvedAmount,
    'Wallet Address': grantApplication.walletAddress || '',
    Category: ['recd0Kn3N4Ffhtwhd'], // Solana Grant
    'Purpose of Payment': grantApplication.projectTitle || '',
    Status: 'Verified',
    ...(grantRegionId
      ? {
          Region: [grantRegionId],
        }
      : {}),
  };
}

export async function addPaymentInfoToAirtable(
  application: GrantApplicationWithUserAndGrant,
) {
  console.debug(
    `Starting addPaymentInfoToAirtable for application ID: ${application.id}`,
  );
  console.debug(
    `Application data: ${safeStringify({
      id: application.id,
      projectTitle: application.projectTitle,
      approvedAmount: application.approvedAmount,
      walletAddress: application.walletAddress,
      kycName: application.kycName,
      userLocation: application.user?.location,
      grantAirtableId: application.grant?.airtableId,
    })}`,
  );

  try {
    const grantsAirtableConfig = airtableConfig(
      process.env.AIRTABLE_GRANTS_API_TOKEN!,
    );
    console.debug('Airtable config created');

    const paymentsAirtableURL = airtableUrl(
      process.env.AIRTABLE_PAYMENTS_BASE_ID!,
      process.env.AIRTABLE_PAYMENTS_TABLE_NAME!,
    );
    console.debug(`Payments Airtable URL: ${paymentsAirtableURL}`);

    const paymentsRegionAirtableURL = airtableUrl(
      process.env.AIRTABLE_PAYMENTS_BASE_ID!,
      process.env.AIRTABLE_PAYMENTS_REGIONS_TABLE_NAME!,
    );
    console.debug(`Grants Region Airtable URL: ${paymentsRegionAirtableURL}`);

    const superteam = Superteams.find(
      (s) =>
        s.country.some(
          (c) => c.toLowerCase() === application.user.location?.toLowerCase(),
        ) || s.region === application.user.location,
    );
    console.debug(
      `Found superteam: ${safeStringify(
        superteam
          ? {
              displayValue: superteam.displayValue,
              region: superteam.region,
              airtableKey: superteam.airtableKey,
            }
          : 'none',
      )}`,
    );

    const regionName = superteam
      ? superteam.airtableKey || superteam.displayValue
      : 'Global';
    console.debug(`Looking up region in Airtable: ${regionName}`);

    const region = await fetchAirtableRecordId(
      paymentsRegionAirtableURL,
      'Country',
      regionName,
      grantsAirtableConfig,
    );
    console.debug(`Fetched region ID from Airtable: ${region || 'not found'}`);

    const airtableData = grantApplicationToAirtable(application, region || '');
    console.debug(`Prepared Airtable data: ${safeStringify(airtableData)}`);

    const airtablePayload = airtableInsert([{ fields: airtableData }]);
    console.debug(
      `Prepared Airtable payload: ${safeStringify(airtablePayload)}`,
    );

    console.debug(`Sending request to Airtable: ${paymentsAirtableURL}`);
    const response = await axios.post(
      paymentsAirtableURL,
      JSON.stringify(airtablePayload),
      grantsAirtableConfig,
    );
    console.debug(`Airtable response status: ${response.status}`);
    console.debug(`Airtable response data: ${safeStringify(response.data)}`);

    return response.data;
  } catch (error: any) {
    console.error(`Error in addPaymentInfoToAirtable: ${error.message}`);
    if (error.response) {
      console.error(
        `Airtable API error response: ${safeStringify(error.response.data)}`,
      );
      console.error(`Airtable API error status: ${error.response.status}`);
      console.error(
        `Airtable API error headers: ${safeStringify(error.response.headers)}`,
      );
    } else if (error.request) {
      console.error(
        `Airtable API no response received: ${safeStringify(error.request)}`,
      );
    }
    throw error;
  }
}
